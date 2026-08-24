from pydantic import BaseModel, ConfigDict, Field


class VisionCheckRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    prompt: str
    image_base64: str = Field(alias="imageBase64")


class VisionCheckResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    result: str