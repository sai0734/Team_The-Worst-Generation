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
    sigungu: str = ""
    thema: str = ""
    srv_pvsn: str = Field(default="", alias="srvPvsn")
    sprt_cyc: str = Field(default="", alias="sprtCyc")
    amount: str = ""


class SubsidySearchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    baby_months: int = Field(alias="babyMonths")
    region_sido: str = Field(default="", alias="regionSido")
    household_size: int | None = Field(default=None, alias="householdSize")
    income_tags: list[str] = Field(default_factory=list, alias="incomeTags")
    

class SubsidySearchResponse(BaseModel):
    items: list[SubsidyItem]