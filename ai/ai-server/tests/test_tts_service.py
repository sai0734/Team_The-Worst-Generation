import io
import unittest
import wave

from app.services.tts_providers import SupertonicTtsProvider
from app.services.tts_service import (
    TtsService,
    TtsSynthesisError,
)


def fake_wav() -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(24000)
        wav_file.writeframes(b"\x00\x00" * 100)
    return buffer.getvalue()


class FakeProvider:
    def __init__(
        self,
        name="FAKE",
        dependency=True,
        model=True,
        error=None,
    ) -> None:
        self.name = name
        self.voice = "test-voice"
        self._dependency = dependency
        self._model = model
        self._error = error
        self.requests = []

    def dependency_ready(self) -> bool:
        return self._dependency

    def model_ready(self) -> bool:
        return self._model

    def synthesize(self, text: str) -> bytes:
        self.requests.append(text)
        if self._error:
            raise self._error
        return fake_wav()


class TtsServiceTests(unittest.TestCase):
    def test_missing_primary_model_is_reported(self) -> None:
        service = TtsService(
            primary_provider=FakeProvider(model=False),
            fallback_provider=FakeProvider(model=False),
        )

        status = service.get_status()

        self.assertEqual("MODEL_MISSING", status.status)
        self.assertFalse(status.model_ready)
        self.assertFalse(status.fallback_ready)

    def test_not_configured_provider_is_rejected(self) -> None:
        service = TtsService(provider_name="NOT_CONFIGURED")

        with self.assertRaisesRegex(
            TtsSynthesisError,
            "STORY_TTS_NOT_CONFIGURED",
        ):
            service.synthesize("읽어 줄 동화")

    def test_primary_provider_returns_wav_audio(self) -> None:
        primary = FakeProvider(name="SUPERTONIC")
        service = TtsService(
            primary_provider=primary,
            fallback_provider=FakeProvider(name="PIPER"),
        )

        audio = service.synthesize("따뜻한 동화를 읽어 줘")

        self.assertEqual("SUPERTONIC", audio.provider)
        self.assertEqual(b"RIFF", audio.content[:4])
        self.assertEqual(b"WAVE", audio.content[8:12])
        self.assertEqual(
            ["따뜻한 동화를 읽어 줘"],
            primary.requests,
        )

    def test_fallback_is_used_when_primary_fails(self) -> None:
        primary = FakeProvider(
            name="SUPERTONIC",
            error=RuntimeError("primary failed"),
        )
        fallback = FakeProvider(name="PIPER")
        service = TtsService(
            primary_provider=primary,
            fallback_provider=fallback,
        )

        audio = service.synthesize("대체 엔진 테스트")

        self.assertEqual("PIPER", audio.provider)
        self.assertEqual(["대체 엔진 테스트"], fallback.requests)

    def test_supertonic_splits_story_scenes(self) -> None:
        provider = SupertonicTtsProvider(
            speaker_id=0,
            speed=1.0,
        )

        chunks = provider._narration_chunks(
            "첫 번째 장면이에요. 아이가 웃었어요.\n\n"
            "두 번째 장면이에요. 모두 잠들었어요."
        )

        self.assertEqual(2, len(chunks))
        self.assertTrue(chunks[0].text.startswith("첫 번째"))
        self.assertTrue(chunks[1].text.startswith("두 번째"))
        self.assertEqual(0.55, chunks[0].pause_after_seconds)
        self.assertEqual(0, chunks[1].pause_after_seconds)
        self.assertLess(chunks[1].speed_multiplier, 1.0)

    def test_supertonic_makes_dialogue_more_lively(self) -> None:
        provider = SupertonicTtsProvider(
            speaker_id=0,
            speed=1.0,
        )

        chunks = provider._narration_chunks(
            "토끼가 조용히 걸어갔어요.\n\n"
            "“앗, 모자가 빙글빙글 돌아가잖아!”\n\n"
            "모두 웃으며 포근한 이불 속에 잠들었어요."
        )

        self.assertEqual(1.0, chunks[0].speed_multiplier)
        self.assertGreater(chunks[1].speed_multiplier, 1.0)
        self.assertLess(chunks[2].speed_multiplier, 1.0)

    def test_supertonic_recognizes_single_quoted_dialogue(self) -> None:
        provider = SupertonicTtsProvider(
            speaker_id=0,
            speed=1.0,
        )

        chunks = provider._narration_chunks(
            "차분하게 이야기를 시작했어요.\n\n"
            "'앗, 모자가 빙글빙글 돌아가네.'\n\n"
            "모두 포근하게 잠들었어요."
        )

        self.assertGreater(chunks[1].speed_multiplier, 1.0)

    def test_supertonic_uses_one_voice_with_distinct_tones(self) -> None:
        provider = SupertonicTtsProvider(
            speaker_id=0,
            speed=1.0,
        )

        chunks = provider._narration_chunks(
            "별빛이 반짝이자 서윤이가 신나게 외쳤어요. "
            "“토끼야, 같이 가자!” "
            "토끼는 귀를 쫑긋 세우며 대답했어요. "
            "“좋아, 내 귀가 나침반이야!”"
        )

        dialogue_chunks = [
            chunk
            for chunk in chunks
            if chunk.speaker_name != "해설"
        ]
        self.assertEqual(["서윤", "토끼"], [
            chunk.speaker_name for chunk in dialogue_chunks
        ])
        self.assertEqual([0, 0], [
            chunk.speaker_id for chunk in dialogue_chunks
        ])
        self.assertEqual(
            "토끼야, 같이 가자!",
            dialogue_chunks[0].text,
        )
        self.assertGreater(
            dialogue_chunks[0].speed_multiplier,
            1.0,
        )
        self.assertNotEqual(
            dialogue_chunks[0].speed_multiplier,
            dialogue_chunks[1].speed_multiplier,
        )

    def test_supertonic_infers_speaker_from_attribution(self) -> None:
        provider = SupertonicTtsProvider(
            speaker_id=0,
            speed=1.0,
        )

        speaker = provider._infer_dialogue_speaker(
            "",
            " 서윤이가 눈을 반짝이며 말했어요.",
            {},
        )

        self.assertEqual("서윤", speaker)

    def test_supertonic_reports_single_narrator_voice(self) -> None:
        provider = SupertonicTtsProvider(
            speaker_id=0,
            speed=1.0,
        )

        self.assertEqual(
            "ko:sid-0;single-narrator",
            provider.voice,
        )


if __name__ == "__main__":
    unittest.main()
