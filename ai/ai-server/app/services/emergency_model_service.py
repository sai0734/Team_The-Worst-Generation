from pathlib import Path

from app.schemas.emergency import EmergencyModelStatusResponse


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MODEL_PATH = PROJECT_ROOT / "models" / "emergency_model.joblib"


class EmergencyModelService:
    """Model-loading boundary for the future emergency prediction model."""

    def __init__(self, model_path: Path = DEFAULT_MODEL_PATH) -> None:
        self.model_path = model_path

    def get_status(self) -> EmergencyModelStatusResponse:
        status = "READY" if self.model_path.is_file() else "NOT_TRAINED"
        return EmergencyModelStatusResponse(
            status=status,
            model_path=str(self.model_path),
        )

