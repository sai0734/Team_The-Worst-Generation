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
    // YSJ - completed_at 컬럼 매핑용
    private LocalDateTime completedAt;

    // 조인결과
    private String title;
    private String description;
    // YSJ - type 소문자로 통일 (MyBatis camelCase)
    private String type;
    private String repeatType;
    private int reward;
    private int urgency;

    // YSJ - 긴급퀘 생성자(시스템 배정이면 null)
    private String createdBy;

    private LocalDate dueDate;
    private String difficulty;
    private String theme;
    private int dueDays;
//    TODO/ DONE/FAILED/EXPIRED

}
