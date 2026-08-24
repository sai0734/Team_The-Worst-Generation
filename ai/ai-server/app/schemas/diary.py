from pydantic import BaseModel, ConfigDict, Field


class DiaryGenerateRequest(BaseModel):
    """육아일기 사진분석 요청 (Base64 인코딩된 이미지)."""

    model_config = ConfigDict(populate_by_name=True)

    image_base64: str = Field(alias="imageBase64")


class DiaryGenerateResponse(BaseModel):
    """생성된 육아일기 문장."""

    content: str