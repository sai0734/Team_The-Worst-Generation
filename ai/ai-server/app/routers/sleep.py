from fastapi import APIRouter

from app.schemas.sleep import SleepAnalysisRequest, SleepAnalysisResponse
from app.services.sleep_service import SleepAnalysisService

router = APIRouter()
sleep_service = SleepAnalysisService()

@router.post("/analyze", response_model=SleepAnalysisResponse)
def analyze_sleep(request: SleepAnalysisRequest) -> SleepAnalysisResponse:
    """Java 백엔드로부터 수면 데이터를 받아 분석 결과를 반환한다."""
    return sleep_service.analyze(request)

