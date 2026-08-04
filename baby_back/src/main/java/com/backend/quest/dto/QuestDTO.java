package com.backend.quest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor

public class QuestDTO {
    private Long questId;
    private String title;
    private String description;
    private String type;
    private String repeatType;
    private int reward;
    private int urgency;
    private boolean active;

}
