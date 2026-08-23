from fastapi import APIRouter

from app.schemas.video import VideoGenerateRequest, VideoGenerateResponse
from app.services.video_service import NarrationTtsService, generate_and_save_video

router = APIRouter()
tts_service = NarrationTtsService()


@router.post("/generate", response_model=VideoGenerateResponse)
def generate_video(request: VideoGenerateRequest) -> VideoGenerateResponse:
    """사진 + 일기 텍스트로 동영상을 생성해서 저장하고, 파일명과 길이를 반환한다."""
    file_name, duration = generate_and_save_video(
        request.image_base64,
        request.narration_text,
        tts_service,
    )
    return VideoGenerateResponse(file_name=file_name, duration_seconds=duration)