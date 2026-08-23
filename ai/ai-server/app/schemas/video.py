from pydantic import BaseModel, ConfigDict, Field


class VideoGenerateRequest(BaseModel):
    """동영상 생성 요청 (Base64 인코딩된 이미지 + 일기 텍스트)."""

    model_config = ConfigDict(populate_by_name=True)

    image_base64: str = Field(alias="imageBase64")
    narration_text: str = Field(alias="narrationText")


class VideoGenerateResponse(BaseModel):
    """생성된 동영상의 파일명과 재생시간."""

    model_config = ConfigDict(populate_by_name=True)

    file_name: str = Field(alias="fileName")
    duration_seconds: float = Field(alias="durationSeconds")