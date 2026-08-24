"""동영상 생성 서비스 - 사진 스타일링(Pillow) + 애니메이션(moviepy) + TTS 내레이션 합성"""

from PIL import Image, ImageDraw, ImageFilter

import math
import os
import tempfile
import uuid
import base64
import io
from pathlib import Path
import numpy as np
from moviepy import ImageClip, CompositeVideoClip, vfx
import uroman as ur
import torch
from transformers import VitsModel, AutoTokenizer
from moviepy import AudioFileClip
import scipy.io.wavfile

TTS_MODEL_NAME = "facebook/mms-tts-kor"

PROJECT_ROOT = Path(__file__).resolve().parents[4]
UPLOAD_DIR = PROJECT_ROOT / "baby_back" / "upload"

def add_polaroid_frame(image: Image.Image) -> Image.Image:
    """사진에 폴라로이드 스타일 흰 테두리 + 그림자"""
    photo = image.convert("RGB")
    width, height = photo.size

    border = int(min(width, height) * 0.05)
    bottom_border  = int(border * 1.5)

    framed_width = width + border * 2
    framed_height = height + border + bottom_border

    framed = Image.new("RGB", (framed_width, framed_height), "white")
    framed.paste(photo, (border, border))

    shadow_margin = int(border * 0.6)
    canvas_size = (framed_width + shadow_margin * 2, framed_height + shadow_margin *2)
    canvas = Image.new("RGB", canvas_size, (245, 240, 234))

    shadow = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rectangle(
        [
            shadow_margin + 4,
            shadow_margin + 6,
            shadow_margin + framed_width + 4,
            shadow_margin + framed_height + 6,
        ],
        fill=(0, 0, 0, 60),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))

    canvas.paste(shadow, (0, 0), shadow)
    canvas.paste(framed, (shadow_margin, shadow_margin))

    return canvas

def create_ken_burns_clip(
    image: Image.Image,
    duration: float,
    output_size: tuple[int, int],
) -> CompositeVideoClip:
    """정지 이미지를 받아 완만하게 확대/축소+기울기+이동하는 영상 클립을 만든다."""
    frame = np.array(image.convert("RGB"))
    output_width, output_height = output_size

    zoom_start = 1.0
    zoom_end = 1.18
    pan_fraction = 0.55
    tilt_max_degrees = 1.5

    def scale(t: float) -> float:
        progress = t / duration
        wave = (1 - math.cos(2 * math.pi * progress)) / 2  # 0 -> 1 -> 0
        return zoom_start + (zoom_end - zoom_start) * wave

    def tilt(t: float) -> float:
        progress = t / duration
        return tilt_max_degrees * math.sin(2 * math.pi * progress)  # 0 -> +max -> 0 -> -max -> 0

    def position(t: float) -> tuple[float, float]:
        current_scale = scale(t)
        margin_x = output_width * (current_scale - 1) / 2
        margin_y = output_height * (current_scale - 1) / 2

        progress = t / duration
        sway = math.sin(2 * math.pi * progress)

        x = -margin_x + sway * margin_x * pan_fraction
        y = -margin_y + sway * margin_y * pan_fraction
        return (x, y)

    base_clip = (
        ImageClip(frame)
        .with_duration(duration)
        .with_effects([vfx.Resize((output_width, output_height))])
    )

    zoomed = base_clip.with_effects([vfx.Resize(scale), vfx.Rotate(tilt, expand=False)])
    zoomed = zoomed.with_position(position)

    result = CompositeVideoClip([zoomed], size=output_size).with_duration(duration)
    result = result.with_effects([vfx.FadeIn(0.6), vfx.FadeOut(0.6)])

    return result

class NarrationTtsService:
    """일기 텍스트를 한국어 음성으로 변환하는 서비스 (facebook/mms-tts-kor)."""

    def __init__(self, model_name: str = TTS_MODEL_NAME) -> None:
        self.model = VitsModel.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.romanizer = ur.Uroman()

    def synthesize(self, text: str) -> tuple[np.ndarray, int]:
        romanized = self.romanizer.romanize_string(text, lcode="kor")
        inputs = self.tokenizer(romanized, return_tensors="pt")

        with torch.no_grad():
            output = self.model(**inputs).waveform

        waveform = output.squeeze().numpy()
        return waveform, self.model.config.sampling_rate

def compose_diary_video(
    image: Image.Image,
    narration_text: str,
    tts_service: NarrationTtsService,
    output_path: str,
    max_dimension: int = 1280,
) -> float:
    """폴라로이드 프레임 + 애니메이션 + TTS 내레이션을 합성해서 mp4로 저장한다."""
    waveform, sample_rate = tts_service.synthesize(narration_text)

    wav_path = tempfile.mktemp(suffix=".wav")
    scipy.io.wavfile.write(wav_path, sample_rate, waveform)

    audio_clip = AudioFileClip(wav_path)
    duration = audio_clip.duration

    framed = add_polaroid_frame(image)
    ratio = framed.width / framed.height
    if ratio >= 1:
        output_size = (max_dimension, round(max_dimension / ratio))
    else:
        output_size = (round(max_dimension * ratio), max_dimension)
    video_clip = create_ken_burns_clip(framed, duration=duration, output_size=output_size)

    final_clip = video_clip.with_audio(audio_clip)
    final_clip.write_videofile(output_path, fps=24, codec="libx264", audio_codec="aac", audio_fps=sample_rate)

    os.remove(wav_path)

    return duration


def generate_and_save_video(
    image_base64: str,
    narration_text: str,
    tts_service: NarrationTtsService,
) -> tuple[str, float]:
    """Base64 이미지 + 일기 텍스트로 동영상을 만들어 자바의 upload 폴더에 저장하고, 파일명과 길이를 반환한다."""
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes))

    file_name = f"{uuid.uuid4()}_diary_video.mp4"
    output_path = UPLOAD_DIR / file_name

    duration = compose_diary_video(image, narration_text, tts_service, str(output_path))

    return file_name, duration

     