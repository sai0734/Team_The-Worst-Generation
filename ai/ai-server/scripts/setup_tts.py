import os
import shutil
import tarfile
import tempfile
from pathlib import Path
from urllib.request import urlopen

from piper.download_voices import download_voice


AI_SERVER_ROOT = Path(__file__).resolve().parents[1]
SUPERTONIC_MODEL_NAME = (
    "sherpa-onnx-supertonic-3-tts-int8-2026-05-11"
)
SUPERTONIC_ARCHIVE_URL = (
    "https://github.com/k2-fsa/sherpa-onnx/releases/download/"
    "tts-models/"
    f"{SUPERTONIC_MODEL_NAME}.tar.bz2"
)
SUPERTONIC_ARCHIVE_BYTES = 128_774_318
SUPERTONIC_LICENSE_URL = (
    "https://huggingface.co/Supertone/supertonic-3/"
    "raw/main/LICENSE"
)
SUPERTONIC_REQUIRED_FILES = (
    "duration_predictor.int8.onnx",
    "text_encoder.int8.onnx",
    "vector_estimator.int8.onnx",
    "vocoder.int8.onnx",
    "tts.json",
    "unicode_indexer.bin",
    "voice.bin",
)
DEFAULT_PIPER_VOICE = "ko_KR-kss-medium"


def resolve_model_root() -> Path:
    configured = Path(
        os.environ.get("STORY_TTS_MODEL_DIR", "models/tts")
    ).expanduser()
    return (
        configured
        if configured.is_absolute()
        else AI_SERVER_ROOT / configured
    )


def resolve_configured_dir(
    environment_key: str,
    default_path: Path,
) -> Path:
    raw_value = os.environ.get(environment_key)
    configured = (
        Path(raw_value).expanduser()
        if raw_value
        else default_path
    )
    return (
        configured
        if configured.is_absolute()
        else AI_SERVER_ROOT / configured
    )


def supertonic_ready(model_dir: Path) -> bool:
    return all(
        (model_dir / file_name).is_file()
        for file_name in SUPERTONIC_REQUIRED_FILES
    )


def download_file(url: str, destination: Path) -> None:
    with urlopen(url, timeout=60) as response:
        with destination.open("wb") as output:
            shutil.copyfileobj(response, output)


def ensure_supertonic_license(model_dir: Path) -> None:
    license_path = model_dir / "MODEL_LICENSE.OpenRAIL-M.txt"
    if not license_path.is_file():
        download_file(SUPERTONIC_LICENSE_URL, license_path)


def setup_supertonic(model_root: Path) -> Path:
    model_dir = resolve_configured_dir(
        "STORY_TTS_SUPERTONIC_MODEL_DIR",
        model_root / SUPERTONIC_MODEL_NAME,
    )
    if supertonic_ready(model_dir):
        ensure_supertonic_license(model_dir)
        print("[tts] Supertonic 3 model already ready.")
        return model_dir
    if model_dir.exists():
        raise RuntimeError(
            "Incomplete Supertonic model directory: "
            f"{model_dir}"
        )

    model_dir.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        prefix="supertonic-setup-",
        dir=model_dir.parent,
    ) as temporary_directory:
        temporary_root = Path(temporary_directory)
        archive_path = temporary_root / "model.tar.bz2"
        extract_root = temporary_root / "extracted"
        print(
            "[tts] Downloading Supertonic 3 model "
            f"({SUPERTONIC_ARCHIVE_BYTES // 1_000_000} MB)..."
        )
        download_file(SUPERTONIC_ARCHIVE_URL, archive_path)
        actual_size = archive_path.stat().st_size
        if actual_size != SUPERTONIC_ARCHIVE_BYTES:
            raise RuntimeError(
                "Supertonic archive size mismatch: "
                f"expected={SUPERTONIC_ARCHIVE_BYTES},"
                f"actual={actual_size}"
            )

        extract_root.mkdir()
        with tarfile.open(archive_path, "r:bz2") as archive:
            archive.extractall(
                extract_root,
                filter="data",
            )
        extracted_model = extract_root / SUPERTONIC_MODEL_NAME
        if not supertonic_ready(extracted_model):
            raise RuntimeError(
                "Downloaded Supertonic model is incomplete."
            )
        shutil.move(str(extracted_model), str(model_dir))

    ensure_supertonic_license(model_dir)
    print("[tts] Supertonic 3 Korean model is ready.")
    return model_dir


def setup_piper(model_root: Path) -> None:
    voice_name = os.environ.get(
        "STORY_TTS_PIPER_VOICE",
        os.environ.get(
            "STORY_TTS_VOICE",
            DEFAULT_PIPER_VOICE,
        ),
    ).strip()
    piper_model_dir = resolve_configured_dir(
        "STORY_TTS_PIPER_MODEL_DIR",
        model_root,
    )
    piper_model_dir.mkdir(parents=True, exist_ok=True)
    print(f"[tts] Piper fallback voice={voice_name}")
    print(f"[tts] Piper modelDir={piper_model_dir}")
    download_voice(voice_name, piper_model_dir)
    print("[tts] Piper fallback model is ready.")


def main() -> int:
    model_root = resolve_model_root()
    model_root.mkdir(parents=True, exist_ok=True)
    print(f"[tts] modelRoot={model_root}")
    setup_supertonic(model_root)
    setup_piper(model_root)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
