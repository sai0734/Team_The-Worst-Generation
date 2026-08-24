from fastapi import APIRouter

from app.schemas.subsidy import (
    SubsidyAskRequest,
    SubsidyAskResponse,
    SubsidySearchRequest,
    SubsidySearchResponse,
)
from app.services import subsidy_rag_service


router = APIRouter()


@router.post("/search", response_model=SubsidySearchResponse)
def search(req: SubsidySearchRequest) -> SubsidySearchResponse:
    """Deterministic metadata-filtered search. No LLM call."""
    items = subsidy_rag_service.structured_search(req.baby_months, req.region_sido)
    return SubsidySearchResponse(items=items)


@router.post("/ask", response_model=SubsidyAskResponse)
def ask(req: SubsidyAskRequest) -> SubsidyAskResponse:
    """RAG: vector search + grounded LLM generation."""
    answer, sources = subsidy_rag_service.ask(req.question, req.baby_months, req.region_sido)
    return SubsidyAskResponse(answer=answer, sources=sources)