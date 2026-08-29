import os
import logging
import re
from urllib.parse import quote

import chromadb
import requests
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

from app.schemas.subsidy import SubsidyItem
from app.services.subsidy_detail_service import build_detail_context
from app.subsidy_config import (
    SUBSIDY_COLLECTION_NAME,
    SUBSIDY_DOCUMENT_COLLECTION_NAME,
    SUBSIDY_EMBEDDING_MODEL,
)

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "chroma_subsidies")
OLLAMA_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "parenting-qwen:8b")
QUERY_COUNT = 5
CANDIDATE_COUNT = 3
DOCUMENT_CANDIDATE_COUNT = 3
DOCUMENT_RETRIEVAL_POOL = 12
OLLAMA_TIMEOUT_SECONDS = 40
OLLAMA_NUM_PREDICT = 240
DOCUMENT_SOURCE_BASE_URL = os.environ.get(
    "SUBSIDY_DOCUMENT_BASE_URL",
    "http://127.0.0.1:5000/api/v1/subsidy/documents",
).rstrip("/")
LLM_FALLBACK_ANSWER = (
    "지원금 목록은 찾았지만 안내문 생성이 지연되었습니다. "
    "아래 공식 정책 링크를 먼저 확인해 주세요."
)
MEDIAN_INCOME_BAND_LABELS = {
    "UNDER_50": "기준중위소득 50% 이하 추정",
    "50_TO_75": "기준중위소득 50% 초과 75% 이하 추정",
    "75_TO_100": "기준중위소득 75% 초과 100% 이하 추정",
    "100_TO_120": "기준중위소득 100% 초과 120% 이하 추정",
    "120_TO_150": "기준중위소득 120% 초과 150% 이하 추정",
    "150_TO_180": "기준중위소득 150% 초과 180% 이하 추정",
    "180_TO_200": "기준중위소득 180% 초과 200% 이하 추정",
    "200_TO_250": "기준중위소득 200% 초과 250% 이하 추정",
    "OVER_250": "기준중위소득 250% 초과 추정",
    "UNKNOWN": "기준중위소득 구간 모름",
}

logger = logging.getLogger(__name__)

_embedding_function = SentenceTransformerEmbeddingFunction(
    model_name=SUBSIDY_EMBEDDING_MODEL,
)
_client = chromadb.PersistentClient(path=CHROMA_PATH)
_collection = _client.get_or_create_collection(
    SUBSIDY_COLLECTION_NAME,
    embedding_function=_embedding_function,
)
_document_collection = _client.get_or_create_collection(
    SUBSIDY_DOCUMENT_COLLECTION_NAME,
    embedding_function=_embedding_function,
)


def life_stage(months: int) -> str:
    if months < 84:
        return "영유아"
    if months < 156:
        return "아동"
    return "청소년"


def life_stage_field(months: int) -> str:
    stage = life_stage(months)
    return {"영유아": "is_infant", "아동": "is_child", "청소년": "is_teen"}[stage]


def _sigungu_candidates(sigungu: str) -> list[str]:
    """카카오의 '성남시 분당구'와 공공데이터의 '성남시' 형식을 함께 검색한다."""
    names = [sigungu.strip(), *(part.strip() for part in sigungu.split())]
    return list(dict.fromkeys(name for name in names if name))


def _where_clause(months: int, sido: str, sigungu: str) -> dict:
    stage_field = life_stage_field(months)
    national_cond = {
        "$and": [
            {"source": "복지로 중앙부처"},
            {stage_field: True},
        ]
    }
    local_conditions: list[dict] = [
        {"source": "복지로 지자체"},
        {stage_field: True},
    ]
    if sido:
        local_conditions.append({"sido": sido})
    if sigungu:
        sigungu_conditions = [
            {"sigungu": name} for name in _sigungu_candidates(sigungu)
        ]
        sigungu_conditions.append({"sigungu": ""})
        local_conditions.append(
            {"$or": sigungu_conditions}
        )
    local_cond = {"$and": local_conditions}
    return {"$or": [national_cond, local_cond]}


def _to_item(doc_id: str, meta: dict) -> SubsidyItem:
    summary = meta.get("summary", "")
    target = meta.get("target", "")
    if target:
        summary = f"[{target} 가구 대상] {summary}"
    return SubsidyItem(
        id=doc_id,
        title=meta["title"],
        summary=summary,
        source=meta["source"],
        link=meta["link"],
    )


def _to_document_item(doc_id: str, document: str, metadata: dict) -> SubsidyItem:
    source_name = str(metadata.get("source_name") or "")
    source_link = (
        f"{DOCUMENT_SOURCE_BASE_URL}/{quote(source_name)}"
        if source_name
        else ""
    )
    summary = " ".join(document.split())
    if len(summary) > 240:
        summary = summary[:240].rstrip() + "…"
    return SubsidyItem(
        id=doc_id,
        title=str(metadata.get("policy_title") or metadata.get("document_title") or source_name),
        summary=summary,
        source=f"보유 문서 · {source_name}",
        link=source_link,
    )


def _document_context(
    profile_query: str,
    sido: str,
    sigungu: str,
    household_types: list[str] | None = None,
) -> tuple[list[str], list[SubsidyItem]]:
    if not sido or not sigungu or _document_collection.count() == 0:
        return [], []

    result = _document_collection.query(
        query_texts=[profile_query],
        n_results=min(DOCUMENT_RETRIEVAL_POOL, _document_collection.count()),
        where={
            "$and": [
                {"sido": sido},
                {"sigungu": sigungu},
            ]
        },
    )
    ids = result["ids"][0]
    documents = result["documents"][0]
    metadatas = result["metadatas"][0]
    distances = result["distances"][0]
    ranked = sorted(
        zip(ids, documents, metadatas, distances),
        key=lambda row: _document_relevance_score(
            profile_query,
            row[1],
            row[3],
            household_types or [],
        ),
        reverse=True,
    )[:DOCUMENT_CANDIDATE_COUNT]
    contexts: list[str] = []
    sources: list[SubsidyItem] = []
    for document_id, document, metadata, _distance in ranked:
        source = _to_document_item(document_id, document, metadata)
        contexts.append(
            "\n".join(
                [
                    f"근거 유형: {metadata.get('document_type', '보유 문서')}",
                    f"원본 문서: {metadata.get('source_name', '')}",
                    f"문서 청크: {int(metadata.get('chunk_index', 0)) + 1}",
                    document,
                    f"원본 파일: {source.link}",
                ]
            )
        )
        sources.append(source)
    return contexts, sources


def _character_ngrams(value: str, size: int = 2) -> set[str]:
    normalized = re.sub(r"[^0-9a-z가-힣]+", "", value.lower())
    return {
        normalized[index : index + size]
        for index in range(max(0, len(normalized) - size + 1))
    }


def _document_relevance_score(
    query: str,
    document: str,
    distance: float,
    household_types: list[str] | None = None,
) -> float:
    """임베딩 유사도와 한국어 문자 단위 일치도를 함께 반영한다."""
    query_ngrams = _character_ngrams(query)
    document_ngrams = _character_ngrams(document)
    lexical_score = (
        len(query_ngrams & document_ngrams) / len(query_ngrams)
        if query_ngrams
        else 0.0
    )
    semantic_score = 1.0 / (1.0 + max(float(distance), 0.0))
    household_match_score = sum(
        1.0
        for household_type in household_types or []
        if household_type.strip() and household_type.strip() in document
    )
    return semantic_score + lexical_score * 2.5 + household_match_score


def _profile_query_text(
    months: int,
    sido: str,
    sigungu: str,
    household_size: int | None,
    median_income_band: str,
    household_types: list[str],
    question: str,
) -> str:
    stage = life_stage(months)
    parts = [f"{months}개월({stage}) 아이"]
    region = " ".join(value for value in (sido, sigungu) if value)
    if region:
        parts.append(f"{region} 거주")
    if household_size:
        parts.append(f"가구원 {household_size}인")
    parts.append(
        MEDIAN_INCOME_BAND_LABELS.get(
            median_income_band, "기준중위소득 구간 모름"
        )
    )
    if household_types:
        parts.append(", ".join(household_types) + " 해당")
    parts.append(question.strip() or "우리 가족이 받을 수 있는 육아 지원금과 신청 방법")
    return " ".join(parts)


def _generate_answer(prompt: str) -> str:
    try:
        res = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "think": False,
                "stream": False,
                "keep_alive": "10m",
                "options": {
                    "num_predict": OLLAMA_NUM_PREDICT,
                    "temperature": 0.2,
                },
            },
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        res.raise_for_status()
        return res.json()["message"]["content"]
    except (requests.Timeout, requests.RequestException) as error:
        logger.warning("SUBSIDY_LLM_FAILED reason=%s", error)
        return LLM_FALLBACK_ANSWER


def _ensure_source_links(answer: str, sources: list[SubsidyItem]) -> str:
    missing = [
        item for item in sources
        if item.link and item.link not in answer
    ]
    if not missing:
        return answer
    lines = "\n".join(f"- {item.title}: {item.link}" for item in missing)
    return f"{answer.rstrip()}\n\n공식 링크\n{lines}"


def _fallback_answer(sources: list[SubsidyItem]) -> str:
    if not sources:
        return LLM_FALLBACK_ANSWER
    policies = "\n".join(
        f"- {source.title}: {source.link or '출처에서 확인 필요'}"
        for source in sources
    )
    return (
        "AI 안내문 생성이 지연되어 검색된 정책을 먼저 보여드립니다.\n"
        f"{policies}"
    )


def ask(
    *,
    question: str,
    months: int,
    sido: str,
    sigungu: str,
    household_size: int | None,
    median_income_band: str,
    household_types: list[str],
) -> tuple[str, list[SubsidyItem]]:
    profile_query = _profile_query_text(
        months,
        sido,
        sigungu,
        household_size,
        median_income_band,
        household_types,
        question,
    )
    document_contexts, document_sources = _document_context(
        profile_query,
        sido,
        sigungu,
        household_types,
    )
    if document_contexts:
        context = "\n\n---\n\n".join(document_contexts)
        sources = document_sources
    else:
        result = _collection.query(
            query_texts=[profile_query],
            n_results=QUERY_COUNT,
            where=_where_clause(months, sido, sigungu),
        )

        ids = result["ids"][0]
        docs = result["documents"][0]
        metas = result["metadatas"][0]
        if not docs:
            return "조건에 맞는 지원금 정보를 찾지 못했습니다.", []

        candidates = list(
            zip(
                ids[:CANDIDATE_COUNT],
                docs[:CANDIDATE_COUNT],
                metas[:CANDIDATE_COUNT],
            )
        )
        api_contexts = build_detail_context(candidates)
        context = "\n\n---\n\n".join(api_contexts)
        sources = [
            _to_item(i, m)
            for i, m in zip(ids[:CANDIDATE_COUNT], metas[:CANDIDATE_COUNT])
        ]
    income_label = MEDIAN_INCOME_BAND_LABELS.get(
        median_income_band, "기준중위소득 구간 모름"
    )
    household_type_label = ", ".join(household_types) if household_types else "해당 없음/미입력"
    user_question = question.strip() or "우리 가족이 받을 수 있는 지원금과 신청 순서를 한 번에 알려줘."
    prompt = f"""너는 육아 가정의 정부지원금 안내자다.
반드시 아래 [검색된 정책 근거]에 있는 정보만 사용한다.
근거가 '시연용 가상 정책 문서'이면 답변 첫 줄에 반드시 '시연용 가상 정책 결과'라고 표시한다.
가족 조건만으로 수급 자격을 확정하지 않는다.
금액, 소득 기준, 신청 방법이 근거에 없으면 지어내지 말고 '공식 페이지에서 확인 필요'라고 쓴다.
설명투(~여서입니다, ~할 수 있습니다)로 풀어 쓰지 말고, 항목과 사실만 짧게 적는다.

[가족 조건]
- 아이 나이: {months}개월 ({life_stage(months)})
- 거주지: {sido} {sigungu}
- 가구원 수: {household_size or '미입력'}명
- 추정 소득 구간: {income_label}
- 가구 특성: {household_type_label}

[검색된 정책 근거]
{context}

[질문]
{user_question}

[답변 형식]
1. 첫 줄: 해당 가능성이 있는 지원금 N개
2. 각 지원금은 아래만 적는다. 이유 설명은 쓰지 않는다.
   - 정책명
   - 지원 내용
   - 신청 방법
   - 링크: 근거의 '공식 링크' 또는 '원본 파일'을 그대로 붙인다. 없으면 https://www.bokjiro.go.kr 만 쓴다.
   - 확인할 내용이 있을 때만 '확인 필요: ...'를 적는다. 빈 '확인 필요'는 쓰지 않는다.
3. 마지막에만 지금 할 일 1~2개를 한두 문장으로 적는다.
4. 정책 원문을 복사하지 않는다.
5. 링크 URL을 지어내지 않는다.
"""
    answer = _generate_answer(prompt)
    if answer == LLM_FALLBACK_ANSWER:
        answer = _fallback_answer(sources)
    return _ensure_source_links(answer, sources), sources
