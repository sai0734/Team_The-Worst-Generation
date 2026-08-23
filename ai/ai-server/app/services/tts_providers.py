import importlib.util
import io
import os
import re
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

import numpy as np


AI_SERVER_ROOT = Path(__file__).resolve().parents[2]
SUPERTONIC_MODEL_NAME = (
    "sherpa-onnx-supertonic-3-tts-int8-2026-05-11"
)
PIPER_VOICE_NAME = "ko_KR-kss-medium"
DIALOGUE_SPAN_PATTERN = re.compile(
    r'(?:“[^”\n]{1,160}”|‘[^’\n]{1,160}’|'
    r'"[^"\n]{1,160}"|\'[^\'\n]{1,160}\')'
)
SPEAKER_PARTICLE_PATTERN = re.compile(
    r"(?P<speaker>[가-힣A-Za-z0-9]{1,12}?)"
    r"(?:이가|가|은|는)"
)
SPEECH_VERB_PATTERN = re.compile(
    r"(?:말했|대답했|외쳤|속삭였|물었|소리쳤|"
    r"중얼거렸|말하|대답하|외치|속삭이|묻|소리치|중얼)"
)


@dataclass(frozen=True)
class NarrationChunk:
    text: str
    speed_multiplier: float
    pause_after_seconds: float
    speaker_id: int
    speaker_name: str


class TtsProvider(Protocol):
    name: str

    @property
    def voice(self) -> str:
        ...

    def dependency_ready(self) -> bool:
        ...

    def model_ready(self) -> bool:
        ...

    def synthesize(self, text: str) -> bytes:
        ...


def resolve_from_ai_server(path: str | Path) -> Path:
    configured = Path(path).expanduser()
    return (
        configured
        if configured.is_absolute()
        else AI_SERVER_ROOT / configured
    )


class SupertonicTtsProvider:
    name = "SUPERTONIC"
    REQUIRED_FILES = (
        "duration_predictor.int8.onnx",
        "text_encoder.int8.onnx",
        "vector_estimator.int8.onnx",
        "vocoder.int8.onnx",
        "tts.json",
        "unicode_indexer.bin",
        "voice.bin",
    )

    def __init__(
        self,
        model_dir: str | Path | None = None,
        speaker_id: int | None = None,
        speed: float | None = None,
        num_steps: int | None = None,
        engine: Any | None = None,
    ) -> None:
        self.model_dir = resolve_from_ai_server(
            model_dir
            or os.environ.get("STORY_TTS_SUPERTONIC_MODEL_DIR")
            or f"models/tts/{SUPERTONIC_MODEL_NAME}"
        )
        self.speaker_id = (
            speaker_id
            if speaker_id is not None
            else self._int_setting(
                "STORY_TTS_SPEAKER_ID",
                default=0,
                minimum=0,
                maximum=9,
            )
        )
        self.speed = (
            speed
            if speed is not None
            else self._float_setting(
                "STORY_TTS_SPEED",
                default=0.95,
                minimum=0.5,
                maximum=2.0,
            )
        )
        self._active_speaker_tones: dict[str, int] = {}
        self.num_steps = (
            num_steps
            if num_steps is not None
            else self._int_setting(
                "STORY_TTS_NUM_STEPS",
                default=8,
                minimum=2,
                maximum=20,
            )
        )
        self._engine = engine

    @property
    def voice(self) -> str:
        return f"ko:sid-{self.speaker_id};single-narrator"

    def dependency_ready(self) -> bool:
        return importlib.util.find_spec("sherpa_onnx") is not None

    def model_ready(self) -> bool:
        return all(
            (self.model_dir / file_name).is_file()
            for file_name in self.REQUIRED_FILES
        )

    def synthesize(self, text: str) -> bytes:
        import sherpa_onnx

        if self._engine is None:
            self._engine = self._load_engine(sherpa_onnx)

        all_samples: list[np.ndarray] = []
        sample_rate: int | None = None
        for chunk in self._narration_chunks(text):
            config = sherpa_onnx.GenerationConfig()
            config.sid = chunk.speaker_id
            config.speed = max(
                0.5,
                min(
                    self.speed * chunk.speed_multiplier,
                    2.0,
                ),
            )
            config.num_steps = self.num_steps
            config.extra["lang"] = "ko"
            audio = self._engine.generate(chunk.text, config)
            chunk_samples = np.asarray(
                audio.samples,
                dtype=np.float32,
            )
            if chunk_samples.size == 0:
                continue
            current_sample_rate = int(audio.sample_rate)
            if sample_rate is None:
                sample_rate = current_sample_rate
            elif current_sample_rate != sample_rate:
                raise RuntimeError("SUPERTONIC_SAMPLE_RATE_CHANGED")
            all_samples.append(chunk_samples)
            if chunk.pause_after_seconds > 0:
                all_samples.append(
                    np.zeros(
                        int(
                            sample_rate
                            * chunk.pause_after_seconds
                        ),
                        dtype=np.float32,
                    )
                )

        if not all_samples or sample_rate is None:
            raise RuntimeError("SUPERTONIC_AUDIO_EMPTY")
        samples = np.concatenate(all_samples)
        return self._samples_to_wav(samples, sample_rate)

    def _load_engine(self, sherpa_onnx: Any) -> Any:
        supertonic = sherpa_onnx.OfflineTtsSupertonicModelConfig(
            duration_predictor=str(
                self.model_dir / "duration_predictor.int8.onnx"
            ),
            text_encoder=str(
                self.model_dir / "text_encoder.int8.onnx"
            ),
            vector_estimator=str(
                self.model_dir / "vector_estimator.int8.onnx"
            ),
            vocoder=str(self.model_dir / "vocoder.int8.onnx"),
            tts_json=str(self.model_dir / "tts.json"),
            unicode_indexer=str(
                self.model_dir / "unicode_indexer.bin"
            ),
            voice_style=str(self.model_dir / "voice.bin"),
        )
        model = sherpa_onnx.OfflineTtsModelConfig(
            supertonic=supertonic,
            num_threads=max(1, min(os.cpu_count() or 2, 4)),
            debug=False,
            provider="cpu",
        )
        config = sherpa_onnx.OfflineTtsConfig(model=model)
        if not config.validate():
            raise RuntimeError("SUPERTONIC_CONFIG_INVALID")
        return sherpa_onnx.OfflineTts(config)

    def _narration_chunks(
        self,
        text: str,
    ) -> list[NarrationChunk]:
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        scenes = [
            scene.strip()
            for scene in re.split(r"\n{2,}", normalized)
            if scene.strip()
        ]
        chunks: list[NarrationChunk] = []
        speaker_map: dict[str, int] = {}
        self._active_speaker_tones = speaker_map
        for scene in scenes:
            scene_chunks: list[NarrationChunk] = []
            raw_lines = [
                line.strip()
                for line in scene.split("\n")
                if line.strip()
            ]
            for raw_line in raw_lines or [scene]:
                scene_chunks.extend(
                    self._line_chunks(raw_line, speaker_map)
                )
            if scene_chunks:
                last = scene_chunks[-1]
                scene_chunks[-1] = NarrationChunk(
                    text=last.text,
                    speed_multiplier=last.speed_multiplier,
                    pause_after_seconds=0.55,
                    speaker_id=last.speaker_id,
                    speaker_name=last.speaker_name,
                )
                chunks.extend(scene_chunks)
        if not chunks:
            chunks = [
                self._narration_chunk(
                    text.strip(),
                    pause_after_seconds=0,
                    speaker_id=self.speaker_id,
                    speaker_name="해설",
                )
            ]
        if len(chunks) > 1:
            last = chunks[-1]
            chunks[-1] = NarrationChunk(
                text=last.text,
                speed_multiplier=(
                    min(last.speed_multiplier, 0.97)
                    if last.speaker_name == "해설"
                    else last.speed_multiplier
                ),
                pause_after_seconds=0,
                speaker_id=last.speaker_id,
                speaker_name=last.speaker_name,
            )
        else:
            only = chunks[0]
            chunks[0] = NarrationChunk(
                text=only.text,
                speed_multiplier=only.speed_multiplier,
                pause_after_seconds=0,
                speaker_id=only.speaker_id,
                speaker_name=only.speaker_name,
            )
        return chunks

    def _line_chunks(
        self,
        line: str,
        speaker_map: dict[str, int],
    ) -> list[NarrationChunk]:
        label_match = re.match(
            r"^(?P<speaker>[^:：\n]{1,20})[:：]\s*(?P<text>.+)$",
            line,
        )
        if label_match:
            candidate_name = label_match.group("speaker").strip()
            if candidate_name.lower() in {
                "해설",
                "내레이션",
                "나레이터",
                "narrator",
            }:
                line = label_match.group("text").strip()
            elif DIALOGUE_SPAN_PATTERN.fullmatch(
                label_match.group("text").strip()
            ):
                dialogue_text = (
                    label_match.group("text").strip()[1:-1].strip()
                )
                speaker_id = self._speaker_id_for(
                    candidate_name,
                    speaker_map,
                )
                return [
                    self._narration_chunk(
                        dialogue_text,
                        pause_after_seconds=0.18,
                        speaker_id=speaker_id,
                        speaker_name=candidate_name,
                        dialogue=True,
                    )
                ]

        dialogue_matches = list(
            DIALOGUE_SPAN_PATTERN.finditer(line)
        )
        if not dialogue_matches:
            return self._text_chunks(
                line,
                speaker_id=self.speaker_id,
                speaker_name="해설",
                dialogue=False,
            )

        results: list[NarrationChunk] = []
        cursor = 0
        for index, dialogue_match in enumerate(dialogue_matches):
            narration_before = line[
                cursor:dialogue_match.start()
            ].strip()
            if narration_before:
                results.extend(
                    self._text_chunks(
                        narration_before,
                        speaker_id=self.speaker_id,
                        speaker_name="해설",
                        dialogue=False,
                    )
                )

            next_start = (
                dialogue_matches[index + 1].start()
                if index + 1 < len(dialogue_matches)
                else len(line)
            )
            context_before = line[
                max(0, dialogue_match.start() - 90):
                dialogue_match.start()
            ]
            context_after = line[
                dialogue_match.end():
                min(next_start, dialogue_match.end() + 90)
            ]
            speaker_name = self._infer_dialogue_speaker(
                context_before,
                context_after,
                speaker_map,
            )
            speaker_id = self._speaker_id_for(
                speaker_name,
                speaker_map,
            )
            results.append(
                self._narration_chunk(
                    dialogue_match.group(0)[1:-1].strip(),
                    pause_after_seconds=0.18,
                    speaker_id=speaker_id,
                    speaker_name=speaker_name,
                    dialogue=True,
                )
            )
            cursor = dialogue_match.end()

        narration_after = line[cursor:].strip()
        if narration_after:
            results.extend(
                self._text_chunks(
                    narration_after,
                    speaker_id=self.speaker_id,
                    speaker_name="해설",
                    dialogue=False,
                )
            )
        return results

    def _text_chunks(
        self,
        spoken_text: str,
        speaker_id: int,
        speaker_name: str,
        dialogue: bool,
    ) -> list[NarrationChunk]:
        sentences = [
            sentence.strip()
            for sentence in re.split(
                r"(?<=[.!?。！？])\s+",
                spoken_text,
            )
            if sentence.strip()
        ]
        results: list[NarrationChunk] = []
        current = ""
        for sentence in sentences or [spoken_text]:
            candidate = (
                sentence
                if not current
                else f"{current} {sentence}"
            )
            if current and len(candidate) > 220:
                results.append(
                    self._narration_chunk(
                        current,
                        pause_after_seconds=0.22,
                        speaker_id=speaker_id,
                        speaker_name=speaker_name,
                        dialogue=dialogue,
                    )
                )
                current = sentence
            else:
                current = candidate
        if current:
            results.append(
                self._narration_chunk(
                    current,
                    pause_after_seconds=(
                        0.18 if dialogue else 0.28
                    ),
                    speaker_id=speaker_id,
                    speaker_name=speaker_name,
                    dialogue=dialogue,
                )
            )
        return results

    def _infer_dialogue_speaker(
        self,
        context_before: str,
        context_after: str,
        speaker_map: dict[str, int],
    ) -> str:
        for context in (context_before, context_after):
            verb_matches = list(
                SPEECH_VERB_PATTERN.finditer(context)
            )
            if verb_matches:
                verb_match = verb_matches[-1]
                subjects = list(
                    SPEAKER_PARTICLE_PATTERN.finditer(
                        context[:verb_match.start()]
                    )
                )
                if subjects:
                    return subjects[-1].group("speaker").strip()

        fallback_index = speaker_map.get("__fallback_index__", 0)
        speaker_map["__fallback_index__"] = fallback_index + 1
        return f"등장인물{fallback_index % 2 + 1}"

    def _speaker_id_for(
        self,
        speaker_name: str,
        speaker_map: dict[str, int],
    ) -> int:
        if speaker_name not in speaker_map:
            character_count = sum(
                1
                for name in speaker_map
                if not name.startswith("__")
            )
            speaker_map[speaker_name] = character_count % 2
        return self.speaker_id

    def _narration_chunk(
        self,
        text: str,
        pause_after_seconds: float,
        speaker_id: int,
        speaker_name: str,
        dialogue: bool = False,
    ) -> NarrationChunk:
        expressive = bool(
            re.search(r'["\'“”‘’]|[!?！？]', text)
        )
        speed_multiplier = 1.0
        if dialogue:
            tone_index = self._active_speaker_tones.get(
                speaker_name,
                0,
            )
            speed_multiplier = (1.07, 0.97)[tone_index % 2]
            if re.search(r"[!！]", text):
                speed_multiplier += 0.04
            elif re.search(r"[?？]", text):
                speed_multiplier += 0.02
        elif expressive:
            speed_multiplier = 1.03
        return NarrationChunk(
            text=text,
            speed_multiplier=speed_multiplier,
            pause_after_seconds=pause_after_seconds,
            speaker_id=speaker_id,
            speaker_name=speaker_name,
        )

    def _samples_to_wav(
        self,
        samples: np.ndarray,
        sample_rate: int,
    ) -> bytes:
        pcm = (
            np.clip(samples, -1.0, 1.0) * 32767.0
        ).astype("<i2")
        audio_buffer = io.BytesIO()
        with wave.open(audio_buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm.tobytes())
        return audio_buffer.getvalue()

    def _int_setting(
        self,
        key: str,
        default: int,
        minimum: int,
        maximum: int,
    ) -> int:
        try:
            value = int(os.environ.get(key, str(default)))
        except ValueError:
            return default
        return value if minimum <= value <= maximum else default

    def _float_setting(
        self,
        key: str,
        default: float,
        minimum: float,
        maximum: float,
    ) -> float:
        try:
            value = float(os.environ.get(key, str(default)))
        except ValueError:
            return default
        return value if minimum <= value <= maximum else default


class PiperTtsProvider:
    name = "PIPER"

    def __init__(
        self,
        model_dir: str | Path | None = None,
        voice_name: str | None = None,
        length_scale: float = 1.1,
        voice_loader: Any | None = None,
    ) -> None:
        self.model_dir = resolve_from_ai_server(
            model_dir
            or os.environ.get("STORY_TTS_PIPER_MODEL_DIR")
            or os.environ.get("STORY_TTS_MODEL_DIR")
            or "models/tts"
        )
        self.voice_name = (
            voice_name
            or os.environ.get("STORY_TTS_PIPER_VOICE")
            or os.environ.get("STORY_TTS_VOICE")
            or PIPER_VOICE_NAME
        )
        self.length_scale = length_scale
        self._voice_loader = voice_loader
        self._voice: Any | None = None

    @property
    def voice(self) -> str:
        return self.voice_name

    @property
    def model_path(self) -> Path:
        return self.model_dir / f"{self.voice_name}.onnx"

    @property
    def config_path(self) -> Path:
        return self.model_dir / f"{self.voice_name}.onnx.json"

    def dependency_ready(self) -> bool:
        return importlib.util.find_spec("piper") is not None

    def model_ready(self) -> bool:
        return self.model_path.is_file() and self.config_path.is_file()

    def synthesize(self, text: str) -> bytes:
        from piper import PiperVoice, SynthesisConfig

        if self._voice is None:
            loader = self._voice_loader or PiperVoice.load
            self._voice = loader(
                self.model_path,
                config_path=self.config_path,
            )
        audio_buffer = io.BytesIO()
        with wave.open(audio_buffer, "wb") as wav_file:
            self._voice.synthesize_wav(
                text,
                wav_file,
                syn_config=SynthesisConfig(
                    length_scale=self.length_scale,
                ),
            )
        return audio_buffer.getvalue()
