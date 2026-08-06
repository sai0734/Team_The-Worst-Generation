package com.backend.quest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// YSJ - 완료율/포인트 통계 DTO
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuestStatsDTO {
    private int dailyCompleted;
    private int dailyTotal;
    private double dailyRate;
    private int weeklyCompleted;
    private int weeklyTotal;
    private double weeklyRate;
    private int pointsEarnedToday;
    private int pointsEarnedWeek;
}
