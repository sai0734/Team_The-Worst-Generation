import os

import chromadb
import requests
from sentence_transformers import SentenceTransformer

from app.schemas.subsidy import SubsidyItem

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "chroma_subsidies")
OLLAMA_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "parenting-qwen:8b")

_embedder = SentenceTransformer("jhgan/ko-sroberta-multitask")
_client = chromadb.PersistentClient(path=CHROMA_PATH)
_collection = _client.get_or_create_collection("subsidies")


def life_stage(months: int) -> str:
    if months < 84:
        return "영유아"
    if months < 156:
        return "아동"
    return "청소년"


def life_stage_field(months: int) -> str:
    stage = life_stage(months)
    return {"영유아": "is_infant", "아동": "is_child", "청소년": "is_teen"}[stage]


def _where_clause(months: int, sido: str) -> dict:
    # 중앙부처는 생애주기 정보가 있어 나이로 거르고, 지자체는 그 필드가 없어 지역으로만 거른다.
    national_cond = {"$and": [{"source": "복지로 중앙부처"}, {life_stage_field(months): True}]}
    if not sido:
        return national_cond
    local_cond = {"$and": [{"source": "복지로 지자체"}, {"sido": sido}]}
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


def _profile_query_text(months: int, sido: str, household_size: int | None, income_tags: list[str]) -> str:
    stage = life_stage(months)
    parts = [f"{months}개월({stage}) 아이"]
    if sido:
        parts.append(f"{sido} 거주")
    if household_size:
        parts.append(f"가구원 {household_size}인")
    if income_tags:
        parts.append(", ".join(income_tags) + "가구")
    parts.append("가 받을 수 있는 지원금")
    return " ".join(parts)

def search_profile(
        months: int,
        sido: str,
        household_size: int | None = None,
        income_tags: list[str] | None = None,
        n_results: int = 20,
) -> list[SubsidyItem]: 
    where = _where_clause(months, sido)  #나이/지역은 1차필터로 거른다
    query_text = _profile_query_text(months, sido, household_size, income_tags or [])
    query_vec = _embedder.encode([query_text]).tolist()

    result = _collection.query(
        query_embeddings=query_vec,
        n_results=n_results,
        where=where,
    )
    ids = result["ids"][0]
    metas = result["metadatas"][0]
    return [_to_item(i, m) for i, m in zip(ids, metas)]


def ask(question: str, months: int, sido: str) -> tuple[str, list[SubsidyItem]]:
    where = _where_clause(months, sido)
    query_vec = _embedder.encode([question]).tolist()
    result = _collection.query(query_embeddings=query_vec, n_results=5, where=where)

    ids = result["ids"][0]
    docs = result["documents"][0]
    metas = result["metadatas"][0]
    if not docs:
        return "조건에 맞는 지원금 정보를 찾지 못했습니다.", []

    context = "\n".join(f"- {d}" for d in docs)
    prompt = f"""너는 육아 지원금 안내자다. 아래 [근거] 안에 있는 내용만 사용해서 답한다.
[근거]에 없는 내용은 "정보 없음"이라고 답하고 지어내지 마라.

[근거]
{context}

[질문]
{question}
"""
    res = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": OLLAMA_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "think": False,
            "stream": False,
        },
        timeout=60,
    )
    res.raise_for_status()
    answer = res.json()["message"]["content"]
    sources = [_to_item(i, m) for i, m in zip(ids, metas)]
    return answer, sources