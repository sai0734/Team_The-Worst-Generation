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
    private String type;    //DAILY | URGENT
    private String repeatType;  //DAILY | WEEKLY
    private int reward;
    private int urgency;
    private boolean active;



}
