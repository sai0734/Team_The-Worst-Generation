from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

class DailySleepTotal(BaseModel):
    """하루치 수면 합계 (Java가 미리 계산해서 보내줌)."""

    model_config = ConfigDict(populate_by_name=True)

    date: str
    nap_minutes: int = Field(alias="napMinutes")
    night_minutes: int = Field(alias="nightMinutes")
    has_record: bool = Field(alias="hasRecord")

class SleepAnalysisRequest(BaseModel):
    """수면조언 분석 요청."""

    model_config = ConfigDict(populate_by_name=True)

    age_in_months: int = Field(alias="ageInMonths")
    daily_totals: list[DailySleepTotal] = Field(alias="dailyTotals")

class SleepAnalysisResponse(BaseModel):
    """수면조언 분석 결과 (아직 문장은 아니고, qwen3에게 넘길 재료)."""

    model_config = ConfigDict(populate_by_name=True)

    trend_minutes_per_day: float = Field(alias="trendMinutesPerDay")
    guideline_min_hours: float = Field(alias="guidelineMinHours")
    guideline_max_hours: float = Field(alias="guidelineMaxHours")
    average_total_hours: float = Field(alias="averageTotalHours")
    anomaly_dates: list[str] = Field(alias="anomalyDates")
    model_status: Literal["READY", "NOT_TRAINED"] = Field(alias="modelStatus")

    
