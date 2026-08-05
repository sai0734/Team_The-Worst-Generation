package com.backend.quest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuestHomeDTO {
    private List<MemberQuestDTO> dailyQuests;
    private List<MemberQuestDTO> urgentQuests;
    private QuestStreakDTO streak;
    private QuestStatsDTO stats;
}
