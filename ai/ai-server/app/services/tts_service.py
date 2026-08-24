import logging
import os
import threading
from dataclasses import dataclass

from app.schemas.story import TtsStatusResponse
from app.services.tts_providers import (
    PiperTtsProvider,
    SupertonicTtsProvider,
    TtsProvider,
)


logger = logging.getLogger(__name__)
DEFAULT_PROVIDER = "SUPERTONIC"
DEFAULT_FALLBACK_PROVIDER = "PIPER"


@dataclass(frozen=True)
class SynthesizedAudio:
    content: bytes
    media_type: str
    filename: str
    provider: str
    voice: str


class TtsSynthesisError(RuntimeError):
    pass


class TtsService:
    """Use Supertonic first and fall back to Piper when necessary."""

    def __init__(
        self,
        primary_provider: TtsProvider | None = None,
        fallback_provider: TtsProvider | None = None,
        provider_name: str | None = None,
        fallback_provider_name: str | None = None,
    ) -> None:
        configured_primary = (
            provider_name
            or os.environ.get("STORY_TTS_PROVIDER")
            or DEFAULT_PROVIDER
        ).strip().upper()
        configured_fallback = (
            fallback_provider_name
            or os.environ.get("STORY_TTS_FALLBACK_PROVIDER")
            or DEFAULT_FALLBACK_PROVIDER
        ).strip().upper()
        self.primary_provider = primary_provider or self._provider(
            configured_primary
        )
        self.fallback_provider = fallback_provider
        if (
            self.fallback_provider is None
            and configured_fallback
            and configured_fallback != configured_primary
        ):
            self.fallback_provider = self._provider(
                configured_fallback
            )
        self._synthesis_lock = threading.Lock()

    def get_status(self) -> TtsStatusResponse:
        if self.primary_provider is None:
            return TtsStatusResponse(
                status="NOT_CONFIGURED",
                provider="NOT_CONFIGURED",
                voice=None,
                modelReady=False,
                fallbackProvider=(
                    self.fallback_provider.name
                    if self.fallback_provider
                    else None
                ),
                fallbackReady=self._ready(self.fallback_provider),
            )

        primary_dependency = self.primary_provider.dependency_ready()
        primary_model = self.primary_provider.model_ready()
        primary_ready = primary_dependency and primary_model
        fallback_ready = self._ready(self.fallback_provider)
        if primary_ready:
            status = "READY"
        elif fallback_ready:
            status = "FALLBACK_READY"
        elif not primary_dependency:
            status = "DEPENDENCY_MISSING"
        else:
            status = "MODEL_MISSING"
        return TtsStatusResponse(
            status=status,
            provider=self.primary_provider.name,
            voice=self.primary_provider.voice,
            modelReady=primary_model,
            fallbackProvider=(
                self.fallback_provider.name
                if self.fallback_provider
                else None
            ),
            fallbackReady=fallback_ready,
        )

    def synthesize(self, text: str) -> SynthesizedAudio:
        if self.primary_provider is None:
            raise TtsSynthesisError("STORY_TTS_NOT_CONFIGURED")

        with self._synthesis_lock:
            try:
                if not self._ready(self.primary_provider):
                    raise TtsSynthesisError(
                        "STORY_TTS_PRIMARY_NOT_READY"
                    )
                return self._synthesize_with(
                    self.primary_provider,
                    text,
                )
            except Exception as primary_error:
                if not self._ready(self.fallback_provider):
                    if isinstance(
                        primary_error,
                        TtsSynthesisError,
                    ):
                        raise primary_error
                    raise TtsSynthesisError(
                        "STORY_TTS_SYNTHESIS_FAILED"
                    ) from primary_error

                logger.warning(
                    "STORY_TTS_FALLBACK_ACTIVATED primary=%s "
                    "fallback=%s textChars=%d reason=%s",
                    self.primary_provider.name,
                    self.fallback_provider.name,
                    len(text),
                    type(primary_error).__name__,
                )
                try:
                    return self._synthesize_with(
                        self.fallback_provider,
                        text,
                    )
                except Exception as fallback_error:
                    logger.exception(
                        "STORY_TTS_FALLBACK_FAILED provider=%s "
                        "textChars=%d reason=%s",
                        self.fallback_provider.name,
                        len(text),
                        type(fallback_error).__name__,
                    )
                    raise TtsSynthesisError(
                        "STORY_TTS_ALL_PROVIDERS_FAILED"
                    ) from fallback_error

    def _synthesize_with(
        self,
        provider: TtsProvider,
        text: str,
    ) -> SynthesizedAudio:
        audio_content = provider.synthesize(text)
        if len(audio_content) <= 44:
            raise TtsSynthesisError("STORY_TTS_AUDIO_EMPTY")
        logger.info(
            "STORY_TTS_SYNTHESIS_SUCCEEDED provider=%s voice=%s "
            "textChars=%d audioBytes=%d",
            provider.name,
            provider.voice,
            len(text),
            len(audio_content),
        )
        return SynthesizedAudio(
            content=audio_content,
            media_type="audio/wav",
            filename="story.wav",
            provider=provider.name,
            voice=provider.voice,
        )

    def _ready(self, provider: TtsProvider | None) -> bool:
        return bool(
            provider
            and provider.dependency_ready()
            and provider.model_ready()
        )

    def _provider(self, name: str) -> TtsProvider | None:
        if name == "SUPERTONIC":
            return SupertonicTtsProvider()
        if name == "PIPER":
            return PiperTtsProvider()
        return None
