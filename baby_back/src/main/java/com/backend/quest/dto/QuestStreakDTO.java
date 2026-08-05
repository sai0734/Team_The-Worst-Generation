package com.backend.quest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// YSJ - 연속 달성(스트릭) DTO
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuestStreakDTO {
    private int currentStreak;
    private int bestStreak;
}
