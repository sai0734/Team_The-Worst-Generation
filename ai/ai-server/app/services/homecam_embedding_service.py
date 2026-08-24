import base64
import binascii
from io import BytesIO

from PIL import Image, UnidentifiedImageError

MODEL_VERSION = "mobilenet_v3_small-imagenet1k_v1"


class HomecamImageDecodeError(ValueError):
    """The given image_base64 could not be decoded into an image."""


class HomecamEmbeddingDimensionError(ValueError):
    """A baseline_embedding was given with a dimension the current model doesn't produce."""


class HomecamEmbeddingService:
    """Turns a cropped safe-zone frame into a feature vector, and compares vectors.

    The MobileNetV3 weights are only loaded on first use so importing this module
    (e.g. at FastAPI startup) stays fast.
    """

    def __init__(self) -> None:
        self._model = None
        self._preprocess = None

    def _ensure_loaded(self) -> None:
        if self._model is not None:
            return

        # Imported lazily too - torch/torchvision are only needed once a request
        # actually comes in, not at server startup.
        import torch
        from torchvision.models import (
            MobileNet_V3_Small_Weights,
            mobilenet_v3_small,
        )

        weights = MobileNet_V3_Small_Weights.IMAGENET1K_V1
        model = mobilenet_v3_small(weights=weights)
        model.eval()

        self._model = model
        self._preprocess = weights.transforms()
        self._torch = torch

    @staticmethod
    def decode_image(image_base64: str) -> Image.Image:
        try:
            raw = base64.b64decode(image_base64, validate=True)
            return Image.open(BytesIO(raw)).convert("RGB")
        except (binascii.Error, UnidentifiedImageError, ValueError) as exc:
            raise HomecamImageDecodeError(str(exc)) from exc

    def embed(self, image: Image.Image) -> list[float]:
        self._ensure_loaded()
        torch = self._torch

        tensor = self._preprocess(image).unsqueeze(0)
        with torch.no_grad():
            features = self._model.features(tensor)
            pooled = torch.nn.functional.adaptive_avg_pool2d(features, 1).flatten(1)

        return pooled.squeeze(0).tolist()

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        if len(a) != len(b):
            raise HomecamEmbeddingDimensionError(
                f"embedding dims differ: {len(a)} vs {len(b)}"
            )

        self._ensure_loaded()
        torch = self._torch

        va = torch.tensor(a)
        vb = torch.tensor(b)
        return torch.nn.functional.cosine_similarity(
            va.unsqueeze(0), vb.unsqueeze(0)
        ).item()
