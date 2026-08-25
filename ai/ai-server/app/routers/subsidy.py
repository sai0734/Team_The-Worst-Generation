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
    items = subsidy_rag_service.search_profile(
        req.baby_months, req.region_sido, req.household_size, req.income_tags,
    )
    return SubsidySearchResponse(items=items)


@router.post("/ask", response_model=SubsidyAskResponse)
def ask(req: SubsidyAskRequest) -> SubsidyAskResponse:
    """RAG: vector search + grounded LLM generation."""
    answer, sources = subsidy_rag_service.ask(req.question, req.baby_months, req.region_sido)
    return SubsidyAskResponse(answer=answer, sources=sources)