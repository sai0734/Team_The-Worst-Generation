"""수면조언 분석 서비스 — 추세 계산, 가이드라인 비교, 이상치 탐지를 담당."""

from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import LinearRegression

from app.schemas.sleep import (
    DailySleepTotal,
    SleepAnalysisRequest,
    SleepAnalysisResponse,
)
from app.services.sleep_guidelines import get_guideline_for_age

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "models" / "sleep_anomaly_model.joblib"


class SleepAnalysisService:
    """수면 데이터를 받아 분석 결과(재료)를 만드는 서비스."""

    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        self.model_path = model_path
        self._anomaly_model = joblib.load(model_path) if model_path.is_file() else None

    def analyze(self, request: SleepAnalysisRequest) -> SleepAnalysisResponse:
        recorded = [d for d in request.daily_totals if d.has_record]
        guideline_min, guideline_max = get_guideline_for_age(request.age_in_months)

        if not recorded:
            return SleepAnalysisResponse(
                trend_minutes_per_day=0.0,
                guideline_min_hours=guideline_min,
                guideline_max_hours=guideline_max,
                average_total_hours=0.0,
                anomaly_dates=[],
                model_status=self._model_status(),
            )

        total_hours = [(d.nap_minutes + d.night_minutes) / 60 for d in recorded]

        return SleepAnalysisResponse(
            trend_minutes_per_day=self._calculate_trend(total_hours),
            guideline_min_hours=guideline_min,
            guideline_max_hours=guideline_max,
            average_total_hours=sum(total_hours) / len(total_hours),
            anomaly_dates=self._detect_anomalies(request.age_in_months, recorded, total_hours),
            model_status=self._model_status(),
        )

    def _calculate_trend(self, total_hours: list[float]) -> float:
        if len(total_hours) < 2:
            return 0.0

        X = np.arange(len(total_hours)).reshape(-1, 1)
        y = np.array(total_hours) * 60

        model = LinearRegression()
        model.fit(X, y)

        return float(model.coef_[0])

    def _detect_anomalies(
        self,
        age_in_months: int,
        recorded: list[DailySleepTotal],
        total_hours: list[float],
    ) -> list[str]:
        if self._anomaly_model is None:
            return []

        X = np.array([[age_in_months, hours] for hours in total_hours])
        predictions = self._anomaly_model.predict(X)

        return [d.date for d, pred in zip(recorded, predictions) if pred == -1]

    def _model_status(self) -> str:
        return "READY" if self._anomaly_model is not None else "NOT_TRAINED"