package com.backend.quest.domain;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Quest {

    private Long questId;
    private String title;
    private String description;
    private String type;       // DAILY | URGENT
    private String difficulty; // EASY | MEDIUM | HARD
    private String theme;      // CARE | ACTIVITY | EMOTION | REQUEST
    private int reward;
    private int urgency;
    private int dueDays;
    private boolean active;
}
