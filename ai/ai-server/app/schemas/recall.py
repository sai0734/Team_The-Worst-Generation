from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class RecallCandidate(BaseModel):
    """One recall notice to compare the registered product against."""

    model_config = ConfigDict(populate_by_name=True)

    recall_id: str = Field(alias="recallId")
    title: str
    brand_name: str | None = Field(default=None, alias="brandName")


class RecallMatchRequest(BaseModel):
    """A registered product plus the recall notices it should be compared to."""

    model_config = ConfigDict(populate_by_name=True)

    item_name: str = Field(alias="itemName")
    brand_name: str | None = Field(default=None, alias="brandName")
    model_name: str | None = Field(default=None, alias="modelName")
    candidates: list[RecallCandidate]


class RecallMatchResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    recall_id: str = Field(alias="recallId")
    score: float


class RecallMatchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    model_status: Literal["NOT_READY", "READY"] = Field(alias="modelStatus")
    matches: list[RecallMatchResult]
