package com.backend.quest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class UrgentQuestCreateDTO {
    private String title;
    private String description;
    private int reward;
    private int urgency;
}


