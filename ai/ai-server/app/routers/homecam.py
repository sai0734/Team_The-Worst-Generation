from fastapi import APIRouter, HTTPException

from app.schemas.homecam import HomecamAnalyzeRequest, HomecamAnalyzeResponse
from app.services.homecam_embedding_service import (
    MODEL_VERSION,
    HomecamEmbeddingDimensionError,
    HomecamEmbeddingService,
    HomecamImageDecodeError,
)

router = APIRouter()
embedding_service = HomecamEmbeddingService()


@router.post("/analyze", response_model=HomecamAnalyzeResponse)
def analyze(request: HomecamAnalyzeRequest) -> HomecamAnalyzeResponse:
    """Embed a cropped safe-zone frame, and score it against a baseline if given.

    baseline_embedding omitted -> just returns an embedding (baseline capture).
    baseline_embedding given -> also returns cosine similarity to it (live check).
    """

    try:
        image = embedding_service.decode_image(request.image_base64)
    except HomecamImageDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"이미지를 디코딩할 수 없습니다: {exc}") from exc

    embedding = embedding_service.embed(image)

    similarity = None
    if request.baseline_embedding is not None:
        try:
            similarity = embedding_service.cosine_similarity(
                embedding, request.baseline_embedding
            )
        except HomecamEmbeddingDimensionError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    return HomecamAnalyzeResponse(
        embedding=embedding,
        similarity=similarity,
        model_version=MODEL_VERSION,
    )
