from fastapi import APIRouter

from app.schemas.health import VisionCheckRequest, VisionCheckResponse
from app.services.health_check_service import HealthCheckService


router = APIRouter()
health_check_service = HealthCheckService()


@router.post("/vision-check", response_model=VisionCheckResponse)
def vision_check(req: VisionCheckRequest) -> VisionCheckResponse:
    result = health_check_service.check(req.prompt, req.image_base64)
    return VisionCheckResponse(result=result)