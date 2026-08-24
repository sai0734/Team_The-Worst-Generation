from fastapi import APIRouter

from app.schemas.emergency import EmergencyModelStatusResponse
from app.services.emergency_model_service import EmergencyModelService


router = APIRouter()
model_service = EmergencyModelService()


@router.get("/model/status", response_model=EmergencyModelStatusResponse)
def get_model_status() -> EmergencyModelStatusResponse:
    """Return whether a trained emergency model artifact is available."""
    return model_service.get_status()
