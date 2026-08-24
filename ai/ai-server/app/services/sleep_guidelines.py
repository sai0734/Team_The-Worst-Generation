"""수면조언 기능에서 공통으로 쓰는 개월수별 권장 수면시간 기준표.

출처: National Sleep foundation 권장 수면시간
"""

# (최소개월, 최대개월, 권장최소시간, 권장최대시간)
SLEEP_GUIDELINES: list[tuple[int, int, float, float]] = [
    (0, 3, 14.0, 17.0),
    (4, 11, 12.0, 15.0),
    (12, 24, 11.0, 14.0),
    (25, 60, 10.0, 13.0),
]

def get_guideline_for_age(age_in_month: int) -> tuple[float, float]:
    """해당 개월수의 권장 수면시간(최소, 최대)를 반환한다."""

    for min_age, max_age, min_hours, max_hours in SLEEP_GUIDELINES:
        if min_age <= age_in_month <= max_age:
            return min_hours, max_hours

    return SLEEP_GUIDELINES[-1][2], SLEEP_GUIDELINES[-1][3]