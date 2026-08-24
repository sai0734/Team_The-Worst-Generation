from fastapi import APIRouter

from app.schemas.diary import DiaryGenerateRequest, DiaryGenerateResponse
from app.services.diary_vision_service import DiaryVisionService

router = APIRouter()
diary_vision_service = DiaryVisionService()


@router.post("/generate", response_model=DiaryGenerateResponse)
def generate_diary_content(request: DiaryGenerateRequest) -> DiaryGenerateResponse:
    """업로드된 아기 사진을 보고 육아일기 문장을 생성한다."""
    content = diary_vision_service.generate_diary_content(request.image_base64)
    return DiaryGenerateResponse(content=content)