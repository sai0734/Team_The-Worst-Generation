package com.backend.babysitter.domain;

public final class BabysitterGradeCalculator {

    // 각 레벨(Lv.1~Lv.10)에 도달하는 데 필요한 최소 선정 횟수
    private static final int[] LEVEL_THRESHOLDS = {0, 1, 2, 3, 5, 7, 10, 15, 20, 30};

    private BabysitterGradeCalculator() {
    }

    // 부모가 실제로 선정(요청 수락)한 횟수 기준 레벨(1~10) - 찜(관심)이 아니라 실제 활동 이력을 반영
    public static int levelFromSelectionCount(long selectionCount) {

        int level = 1;

        for (int i = 0; i < LEVEL_THRESHOLDS.length; i++) {
            if (selectionCount >= LEVEL_THRESHOLDS[i]) {
                level = i + 1;
            }
        }

        return level;
    }
}
