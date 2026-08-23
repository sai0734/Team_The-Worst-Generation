"""육아일기 사진분석 서비스 — VARCO-VISION으로 아기 사진을 보고 일기 문장을 생성."""

import base64
import io

import torch
from PIL import Image
from transformers import AutoProcessor, LlavaOnevisionForConditionalGeneration

MODEL_NAME = "NCSOFT/VARCO-VISION-2.0-1.7B"

MAX_IMAGE_DIMENSION = 1536

DIARY_PROMPT = (
    "너는 부모를 대신해서 아기 사진을 보고 육아일기를 써주는 역할이야. "
    "사진 속 상황을 보고, 오늘 하루 있었던 일처럼 자연스럽고 따뜻한 한국어로 4~6문장 정도 써줘. "
    "사진에 없는 내용은 지어내지 말고, 사진에서 실제로 보이는 것 위주로 써줘. "
    "딱딱한 문체 말고, 부모가 직접 쓴 것 같은 편안한 말투로 써줘. "
    "같은 단어나 표현이 반복되지 않게 자연스럽게 이어서 써줘. "
    "반드시 한글로만 작성하고, 중국어 한자나 영어 단어를 절대 섞지 마."
)


class DiaryVisionService:
    """VARCO-VISION 모델을 로드해서 사진 -> 일기 텍스트를 생성하는 서비스."""

    def __init__(self, model_name: str = MODEL_NAME) -> None:
        self.model = LlavaOnevisionForConditionalGeneration.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            attn_implementation="sdpa",
            device_map="auto",
        )
        self.processor = AutoProcessor.from_pretrained(model_name)

    def generate_diary_content(self, image_base64: str) -> str:
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.LANCZOS)

        conversation = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": DIARY_PROMPT},
                ],
            },
        ]

        inputs = self.processor.apply_chat_template(
            conversation,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        ).to(self.model.device, torch.float16)

        generate_ids = self.model.generate(**inputs, max_new_tokens=512)
        generate_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generate_ids)
        ]

        return self.processor.decode(generate_ids_trimmed[0], skip_special_tokens=True)