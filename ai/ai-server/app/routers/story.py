import logging

from fastapi import APIRouter, HTTPException, Response

from app.schemas.story import (
    StoryGenerateRequest,
    StoryGenerateResponse,
    StoryModuleStatusResponse,
    TtsSynthesizeRequest,
    TtsStatusResponse,
)
from app.services.story_generation_service import StoryGenerationError
from app.services.story_service import StoryService
from app.services.tts_service import TtsService, TtsSynthesisError


logger = logging.getLogger(__name__)
router = APIRouter()
story_service = StoryService()
tts_service = TtsService()


@router.get("/status", response_model=StoryModuleStatusResponse)
def get_story_status() -> StoryModuleStatusResponse:
    return story_service.get_status()


@router.post("/generate", response_model=StoryGenerateResponse)
def generate_story(
    request: StoryGenerateRequest,
) -> StoryGenerateResponse:
    try:
        return story_service.generate(request)
    except StoryGenerationError as error:
        logger.exception(
            "STORY_GENERATION_FAILED generationMode=LLM reason=%s",
            str(error),
        )
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error


@router.get("/tts/status", response_model=TtsStatusResponse)
def get_tts_status() -> TtsStatusResponse:
    return tts_service.get_status()


@router.post("/tts/synthesize")
def synthesize_story(
    request: TtsSynthesizeRequest,
) -> Response:
    try:
        audio = tts_service.synthesize(request.text)
    except TtsSynthesisError as error:
        logger.exception(
            "STORY_TTS_REQUEST_FAILED textChars=%d reason=%s",
            len(request.text),
            str(error),
        )
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    return Response(
        content=audio.content,
        media_type=audio.media_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{audio.filename}"'
            ),
            "X-TTS-Provider": audio.provider,
            "X-TTS-Voice": audio.voice,
        },
    )
