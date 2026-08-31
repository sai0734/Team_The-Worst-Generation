from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.schemas.subsidy import (
    SubsidyAskRequest,
    SubsidyAskResponse,
    SubsidyReindexResponse,
)
from app.services import subsidy_index_service, subsidy_rag_service
from app.services.subsidy_document_index_service import resolve_document_path


router = APIRouter()


@router.post("/ask", response_model=SubsidyAskResponse)
def ask(req: SubsidyAskRequest) -> SubsidyAskResponse:
    """가족 조건 검색 + 정책 상세 조회 + 근거 기반 LLM 안내."""
    answer, sources = subsidy_rag_service.ask(
        question=req.question,
        months=req.baby_months,
        sido=req.region_sido,
        sigungu=req.region_sigungu,
        household_size=req.household_size,
        median_income_band=req.median_income_band,
        household_types=req.household_types,
    )
    return SubsidyAskResponse(answer=answer, sources=sources)


@router.post("/reindex", response_model=SubsidyReindexResponse)
def reindex() -> SubsidyReindexResponse:
    result = subsidy_index_service.reindex_subsidies()
    return SubsidyReindexResponse.model_validate(result)


@router.get("/documents/{file_name}")
def document(file_name: str) -> FileResponse:
    path = resolve_document_path(file_name)
    if path is None:
        raise HTTPException(status_code=404, detail="지원금 원본 문서를 찾을 수 없습니다.")
    return FileResponse(
        path,
        filename=path.name,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.get("/reindex/status", response_model=SubsidyReindexResponse)
def reindex_status() -> SubsidyReindexResponse:
    result = subsidy_index_service.get_reindex_status()
    return SubsidyReindexResponse.model_validate(result)
