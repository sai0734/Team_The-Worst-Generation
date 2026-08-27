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


class SubsidyAskRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str = ""
    baby_months: int = Field(alias="babyMonths", ge=0)
    region_sido: str = Field(default="", alias="regionSido")
    region_sigungu: str = Field(default="", alias="regionSigungu")
    household_size: int | None = Field(default=None, alias="householdSize", ge=1)
    median_income_band: str = Field(default="UNKNOWN", alias="medianIncomeBand")
    household_types: list[str] = Field(default_factory=list, alias="householdTypes")


class SubsidyAskResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    answer: str
    sources: list[SubsidyItem]


class SubsidyReindexResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    success: bool
    running: bool
    message: str
    total_count: int = Field(default=0, alias="totalCount")
    inserted_count: int = Field(default=0, alias="insertedCount")
    updated_count: int = Field(default=0, alias="updatedCount")
    unchanged_count: int = Field(default=0, alias="unchangedCount")
    deleted_count: int = Field(default=0, alias="deletedCount")
    started_at: str | None = Field(default=None, alias="startedAt")
    completed_at: str | None = Field(default=None, alias="completedAt")
