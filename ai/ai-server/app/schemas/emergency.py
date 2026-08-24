from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class EmergencyRoomSnapshot(BaseModel):
    """One emergency-room state received from the Spring backend."""

    model_config = ConfigDict(populate_by_name=True)

    hospital_id: str = Field(alias="hospitalId")
    hospital_name: str = Field(alias="hospitalName")
    distance: float | None = None
    available_emergency_beds: int | None = Field(
        default=None,
        alias="availableEmergencyBeds",
    )
    available_operating_rooms: int | None = Field(
        default=None,
        alias="availableOperatingRooms",
    )
    pediatric_ventilator_available: bool | None = Field(
        default=None,
        alias="pediatricVentilatorAvailable",
    )
    incubator_available: bool | None = Field(
        default=None,
        alias="incubatorAvailable",
    )
    ct_available: bool | None = Field(default=None, alias="ctAvailable")
    mri_available: bool | None = Field(default=None, alias="mriAvailable")
    ventilator_available: bool | None = Field(
        default=None,
        alias="ventilatorAvailable",
    )
    updated_at: str | None = Field(default=None, alias="updatedAt")
    collected_at: datetime = Field(alias="collectedAt")


class EmergencySnapshotRequest(BaseModel):
    """Batch of emergency-room snapshots collected at the same time."""

    snapshots: list[EmergencyRoomSnapshot]


class EmergencyPredictionRequest(BaseModel):
    """Candidate emergency rooms to score after a model is trained."""

    hospitals: list[EmergencyRoomSnapshot]


class EmergencyHospitalPrediction(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    hospital_id: str = Field(alias="hospitalId")
    predicted_beds: float | None = Field(alias="predictedBeds")
    congestion_score: float | None = Field(alias="congestionScore")


class EmergencyPredictionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    model_version: str = Field(alias="modelVersion")
    predictions: list[EmergencyHospitalPrediction]


class EmergencyModelStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: Literal["NOT_TRAINED", "READY"]
    model_path: str = Field(alias="modelPath")
