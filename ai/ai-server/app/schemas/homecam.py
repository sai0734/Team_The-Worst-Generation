from typing import List

from pydantic import BaseModel, ConfigDict, Field


class HomecamDetectRequest(BaseModel):
    """카메라 전체 프레임 (더 이상 안전영역으로 미리 자르지 않고 원본 그대로 보냄)."""

    model_config = ConfigDict(populate_by_name=True)

    image_base64: str = Field(alias="imageBase64")


class DetectedPersonSchema(BaseModel):
    """탐지된 사람 한 명의 바운딩 박스 (프레임 대비 0~1 비율 좌표)."""

    model_config = ConfigDict(populate_by_name=True)

    confidence: float
    x_ratio: float = Field(alias="xRatio")
    y_ratio: float = Field(alias="yRatio")
    w_ratio: float = Field(alias="wRatio")
    h_ratio: float = Field(alias="hRatio")


class HomecamDetectResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    people: List[DetectedPersonSchema]
    model_version: str = Field(alias="modelVersion")
