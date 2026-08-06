package com.backend.quest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class ChallengeDTO {
    private long id;        // member_challenge id
    private long challengeId;
    private String title;
    private String status;
    private int currentStreak;
    private int targetDays;
    private LocalDate lastCheckDate;

}
