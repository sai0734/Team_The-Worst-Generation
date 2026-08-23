from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]


class StoryLength(str, Enum):
    SHORT = "SHORT"
    MEDIUM = "MEDIUM"
    LONG = "LONG"


class StoryTheme(str, Enum):
    BEDTIME = "BEDTIME"
    ADVENTURE = "ADVENTURE"
    FRIENDSHIP = "FRIENDSHIP"
    HABIT = "HABIT"
    FAMILY = "FAMILY"


class StoryGenerationMode(str, Enum):
    LLM = "LLM"


class StoryGenerateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    baby_name: Annotated[
        str,
        StringConstraints(strip_whitespace=True, min_length=1, max_length=20),
    ] = Field(alias="babyName")
    age_months: int = Field(alias="ageMonths", ge=0, le=120)
    interests: list[ShortText] = Field(default_factory=list, max_length=8)
    favorite_items: list[ShortText] = Field(
        default_factory=list,
        alias="favoriteItems",
        max_length=8,
    )
    theme: StoryTheme = StoryTheme.BEDTIME
    length: StoryLength = StoryLength.SHORT


class StoryGenerateResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    story_id: str = Field(alias="storyId")
    title: str
    content: str
    generation_mode: StoryGenerationMode = Field(alias="generationMode")
    character_count: int = Field(alias="characterCount")
    scene_count: int = Field(alias="sceneCount")


class StoryModuleStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: Literal["READY", "NOT_CONFIGURED"]
    generation_mode: StoryGenerationMode = Field(alias="generationMode")
    model: str


class TtsStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: Literal[
        "NOT_CONFIGURED",
        "DEPENDENCY_MISSING",
        "MODEL_MISSING",
        "FALLBACK_READY",
        "READY",
    ]
    provider: str
    voice: str | None = None
    model_ready: bool = Field(alias="modelReady")
    fallback_provider: str | None = Field(
        default=None,
        alias="fallbackProvider",
    )
    fallback_ready: bool = Field(
        default=False,
        alias="fallbackReady",
    )


class TtsSynthesizeRequest(BaseModel):
    text: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
            max_length=12000,
        ),
    ]
