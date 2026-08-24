import logging
from uuid import uuid4

from app.schemas.story import (
    StoryGenerateRequest,
    StoryGenerateResponse,
    StoryGenerationMode,
    StoryModuleStatusResponse,
)
from app.services.story_generation_service import StoryGenerationService


logger = logging.getLogger(__name__)


class StoryService:
    def __init__(
        self,
        generation_service: StoryGenerationService | None = None,
    ) -> None:
        self.generation_service = (
            generation_service or StoryGenerationService()
        )

    def get_status(self) -> StoryModuleStatusResponse:
        return StoryModuleStatusResponse(
            status=(
                "READY"
                if self.generation_service.enabled
                else "NOT_CONFIGURED"
            ),
            generation_mode=StoryGenerationMode.LLM,
            model=self.generation_service.model,
        )

    def generate(
        self,
        request: StoryGenerateRequest,
    ) -> StoryGenerateResponse:
        story_id = f"story_{uuid4()}"

        generated = self.generation_service.generate(request)
        mode = StoryGenerationMode.LLM

        content = "\n\n".join(generated.scenes)
        logger.info(
            "STORY_GENERATED storyId=%s generationMode=%s "
            "characterCount=%d sceneCount=%d speakingCharacters=%d",
            story_id,
            mode.value,
            len(content),
            len(generated.scenes),
            len(generated.characters),
        )

        return StoryGenerateResponse(
            story_id=story_id,
            title=generated.title,
            content=content,
            generation_mode=mode,
            character_count=len(content),
            scene_count=len(generated.scenes),
        )
