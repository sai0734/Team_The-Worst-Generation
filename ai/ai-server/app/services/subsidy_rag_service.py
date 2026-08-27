import os
import logging

import chromadb
import requests
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

from app.schemas.subsidy import SubsidyItem
from app.services.subsidy_detail_service import build_detail_context
from app.subsidy_config import SUBSIDY_COLLECTION_NAME, SUBSIDY_EMBEDDING_MODEL

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "chroma_subsidies")
OLLAMA_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "parenting-qwen:8b")
QUERY_COUNT = 5
CANDIDATE_COUNT = 3
OLLAMA_TIMEOUT_SECONDS = 40
OLLAMA_NUM_PREDICT = 350
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

    candidates = list(zip(ids[:CANDIDATE_COUNT], docs[:CANDIDATE_COUNT], metas[:CANDIDATE_COUNT]))
    detail_context = build_detail_context(candidates)
    context = "\n\n---\n\n".join(detail_context)
    income_label = MEDIAN_INCOME_BAND_LABELS.get(
        median_income_band, "기준중위소득 구간 모름"
    )
    household_type_label = ", ".join(household_types) if household_types else "해당 없음/미입력"
    user_question = question.strip() or "우리 가족이 받을 수 있는 지원금과 신청 순서를 한 번에 알려줘."
    prompt = f"""너는 육아 가정의 정부지원금 안내자다.
반드시 아래 [공식 정책 근거]에 있는 정보만 사용한다.
가족 조건만으로 수급 자격을 확정하지 않는다.
금액, 소득 기준, 신청 방법이 근거에 없으면 지어내지 말고 '공식 페이지에서 확인 필요'라고 쓴다.
설명투(~여서입니다, ~할 수 있습니다)로 풀어 쓰지 말고, 항목과 사실만 짧게 적는다.

[가족 조건]
- 아이 나이: {months}개월 ({life_stage(months)})
- 거주지: {sido} {sigungu}
- 가구원 수: {household_size or '미입력'}명
- 추정 소득 구간: {income_label}
- 가구 특성: {household_type_label}

[공식 정책 근거]
{context}

[질문]
{user_question}

[답변 형식]
1. 첫 줄: 해당 가능성이 있는 지원금 N개
2. 각 지원금은 아래만 적는다. 이유 설명은 쓰지 않는다.
   - 정책명
   - 지원 내용
   - 신청 방법
   - 링크: 근거의 '공식 링크'를 그대로 붙인다. 없으면 https://www.bokjiro.go.kr 만 쓴다.
   - 확인할 내용이 있을 때만 '확인 필요: ...'를 적는다. 빈 '확인 필요'는 쓰지 않는다.
3. 마지막에만 지금 할 일 1~2개를 한두 문장으로 적는다.
4. 정책 원문을 복사하지 않는다.
5. 링크 URL을 지어내지 않는다.
"""
    answer = _generate_answer(prompt)
    sources = [_to_item(i, m) for i, m in zip(ids[:CANDIDATE_COUNT], metas[:CANDIDATE_COUNT])]
    return _ensure_source_links(answer, sources), sources
