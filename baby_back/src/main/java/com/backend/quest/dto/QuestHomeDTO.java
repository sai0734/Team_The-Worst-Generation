package com.backend.quest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@@Builder
@AllArgsConstructor
@NoArgsConstructor

public class QuestHomeDTO {
    private List<MemberQuestDTO> dailyQuests;
    private List<MemberQuestDTO> urgentQuests;
    private QuestStreakDTO streak;
    private QuestStatsDTO stats;
}

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
class QuestStreakDTO {
    private int currentStreak;
    private int bestStreak;
}

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
class QuestStatsDTO {
    private int dailyCompleted;
    private int dailyTotal;
    private double dailyRate;
    private int weeklyCompleted;
    private int weeklyTotal;
    private double weeklyRate;
    private int pointsEarnedToday;
    private int pointsEarnedWeek;


}
