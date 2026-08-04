package com.backend.quest.domain;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor

public class MemberQuest {

    private Long id;
    private String memberEmail;
    private Long questId;
    private String status;      //TODO | DONE
    private LocalDate assignedDate;
    private LocalDateTime completeAt;

    // 조인결과
    private String title;
    private String description;
    private String Type;
    private String repeatType;
    private int reward;
    private int urgency;

}
