"""수면 이상치 탐지 모델(IsolationForest) 학습 스크립트.

API 서버 실행과는 완전히 분리된 별도 스크립트다.
SLEEP_GUIDELINES를 기준으로 '정상적인' 수면 패턴을 합성 데이터로 만들어서
IsolationForest를 학습시키고, models/sleep_anomaly_model.joblib로 저장한다.
"""

from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest

from app.services.sleep_guidelines import SLEEP_GUIDELINES

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "models" / "sleep_anomaly_model.joblib"

SAMPLES_PER_MONTH = 50

def generate_synthetic_data() -> np.ndarray:
    """개월수별 권장 수면시간 범위를 기준으로 '정상 패턴' 합성 데이터를 만든다."""

    rows = []
    for min_age, max_age, min_hours, max_hours in SLEEP_GUIDELINES:
        mid = (min_hours + max_hours) / 2
        spread = (max_hours - min_hours) / 2

        for age in range(min_age, max_age + 1):
            totals = np.random.normal(loc=mid, scale=spread * 0.6, size=SAMPLES_PER_MONTH)
            for total in totals:
                rows.append([age, total])

    return np.array(rows)

def main() -> None:
    X = generate_synthetic_data()

    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    print(f"학습 완료: {len(X)}개 샘플, 저장 위치: {MODEL_PATH}")


if __name__ == "__main__":
    main()