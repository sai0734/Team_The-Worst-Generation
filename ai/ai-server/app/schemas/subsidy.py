from pydantic import BaseModel, ConfigDict, Field


class SubsidyItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    category: str = "SUBSIDY"
    title: str
    summary: str
    status: str = "APPLY"
    source: str
    link: str


class SubsidySearchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    baby_months: int = Field(alias="babyMonths")
    region_sido: str = Field(default="", alias="regionSido")
    household_size: int | None = Field(default=None, alias="householdSize")
    income_tags: list[str] = Field(default_factory=list, alias="incomeTags")
    

class SubsidySearchResponse(BaseModel):
    items: list[SubsidyItem]


class SubsidyAskRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str
    baby_months: int = Field(alias="babyMonths")
    region_sido: str = Field(default="", alias="regionSido")


class SubsidyAskResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    answer: str
    sources: list[SubsidyItem]