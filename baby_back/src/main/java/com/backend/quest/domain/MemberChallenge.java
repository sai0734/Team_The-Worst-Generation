package com.backend.quest.domain;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class MemberChallenge {

    private Long id;
    private String memberEmail;
    private Long challengeId;
    private String status;
    private int currentStreak;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate lastCheckDate;

    private String title;
    private int targetDays;
}
