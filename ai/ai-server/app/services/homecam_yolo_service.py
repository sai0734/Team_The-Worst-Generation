import base64
import binascii

import cv2
import numpy as np

MODEL_VERSION = "yolov8n"

# COCO 클래스 0번 = "person"
PERSON_CLASS_ID = 0
CONFIDENCE_THRESHOLD = 0.4


class HomecamImageDecodeError(ValueError):
    """The given image_base64 could not be decoded into an image."""


class DetectedPerson:
    """탐지된 사람 한 명의 바운딩 박스 (원본 프레임 대비 0~1 비율 좌표)."""

    def __init__(
        self,
        confidence: float,
        x_ratio: float,
        y_ratio: float,
        w_ratio: float,
        h_ratio: float,
    ) -> None:
        self.confidence = confidence
        self.x_ratio = x_ratio
        self.y_ratio = y_ratio
        self.w_ratio = w_ratio
        self.h_ratio = h_ratio


class HomecamYoloService:
    """카메라 프레임에서 YOLOv8로 "사람"만 탐지한다.

    안전영역(사각형) 안에 있는지 판정하지는 않는다 - 탐지된 좌표만 돌려주고,
    저장된 안전영역과 겹치는지 최종 판정은 Spring(HomeCamAnalyzeService)이 한다.
    YOLOv8 가중치는 첫 요청이 올 때 한 번만 로드한다(서버 기동 자체는 빠르게 유지).
    """

    def __init__(self) -> None:
        self._model = None

    def _ensure_loaded(self) -> None:
        if self._model is not None:
            return

        # ultralytics는 요청이 실제로 올 때만 필요하므로 여기서 지연 import
        from ultralytics import YOLO

        self._model = YOLO("yolov8n.pt")

    @staticmethod
    def decode_image(image_base64: str) -> np.ndarray:
        try:
            raw = base64.b64decode(image_base64, validate=True)
        except binascii.Error as exc:
            raise HomecamImageDecodeError(str(exc)) from exc

        array = np.frombuffer(raw, dtype=np.uint8)
        image = cv2.imdecode(array, cv2.IMREAD_COLOR)
        if image is None:
            raise HomecamImageDecodeError("OpenCV가 이미지를 디코딩하지 못했습니다.")

        return image

    def detect_people(self, image: np.ndarray) -> list[DetectedPerson]:
        self._ensure_loaded()

        height, width = image.shape[:2]
        results = self._model.predict(image, verbose=False)[0]

        people: list[DetectedPerson] = []
        for box in results.boxes:
            if int(box.cls[0]) != PERSON_CLASS_ID:
                continue

            confidence = float(box.conf[0])
            if confidence < CONFIDENCE_THRESHOLD:
                continue

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            people.append(
                DetectedPerson(
                    confidence=confidence,
                    x_ratio=x1 / width,
                    y_ratio=y1 / height,
                    w_ratio=(x2 - x1) / width,
                    h_ratio=(y2 - y1) / height,
                )
            )

        return people
