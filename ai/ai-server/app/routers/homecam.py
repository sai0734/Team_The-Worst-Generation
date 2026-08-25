from fastapi import APIRouter, HTTPException

from app.schemas.homecam import (
    DetectedPersonSchema,
    HomecamDetectRequest,
    HomecamDetectResponse,
)
from app.services.homecam_yolo_service import (
    MODEL_VERSION,
    HomecamImageDecodeError,
    HomecamYoloService,
)

router = APIRouter()
detection_service = HomecamYoloService()


@router.post("/analyze", response_model=HomecamDetectResponse)
def analyze(request: HomecamDetectRequest) -> HomecamDetectResponse:
    """카메라 전체 프레임에서 사람을 탐지해 위치(비율 좌표)만 돌려준다.

    안전영역(사각형)과 겹치는지 판정은 여기서 하지 않는다 - Spring이 저장된
    안전영역 좌표와 비교해서 최종 판정한다.
    """

    try:
        image = detection_service.decode_image(request.image_base64)
    except HomecamImageDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"이미지를 디코딩할 수 없습니다: {exc}") from exc

    people = detection_service.detect_people(image)

    return HomecamDetectResponse(
        people=[
            DetectedPersonSchema(
                confidence=person.confidence,
                x_ratio=person.x_ratio,
                y_ratio=person.y_ratio,
                w_ratio=person.w_ratio,
                h_ratio=person.h_ratio,
            )
            for person in people
        ],
        model_version=MODEL_VERSION,
    )
