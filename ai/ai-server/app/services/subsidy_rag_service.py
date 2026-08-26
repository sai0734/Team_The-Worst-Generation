import os

import chromadb
from sentence_transformers import SentenceTransformer

from app.schemas.subsidy import SubsidyItem

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "chroma_subsidies")

_embedder = SentenceTransformer("jhgan/ko-sroberta-multitask")
_embedder.max_seq_length = 512
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

def _to_item(doc_id: str, meta: dict) -> SubsidyItem:
    summary = meta.get("summary", "")
    target = meta.get("target", "")
    if target:
        summary = f"[{target} 가구 대상 {summary}]"
    return SubsidyItem(
        id=doc_id,
        title=meta["title"],
        summary=summary,
        source=meta["source"],
        link=meta["link"],
        sigungu=meta.get("sigungu", ""),
        thema=meta.get("thema", ""),
        srv_pvsn=meta.get("srv_pvsn", ""),
        sprt_cyc=meta.get("sprt_cyc", ""),
        amount=meta.get("amount", ""),
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