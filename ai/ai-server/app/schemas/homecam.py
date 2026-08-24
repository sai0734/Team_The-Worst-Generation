from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class HomecamAnalyzeRequest(BaseModel):
    """A cropped safe-zone frame, optionally compared against a stored baseline."""

    model_config = ConfigDict(populate_by_name=True)

    image_base64: str = Field(alias="imageBase64")
    # Omit to just extract an embedding (used once, when the safe zone is first saved).
    baseline_embedding: Optional[list[float]] = Field(
        default=None,
        alias="baselineEmbedding",
    )


class HomecamAnalyzeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    embedding: list[float]
    # Only present when a baseline_embedding was provided in the request.
    similarity: Optional[float] = None
    model_version: str = Field(alias="modelVersion")
