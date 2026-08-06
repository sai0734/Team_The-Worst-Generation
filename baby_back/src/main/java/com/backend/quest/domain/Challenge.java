package com.backend.quest.domain;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Challenge {
    private Long challengeId;
    private String title;
    private String description;
    private int targetDays;
    private int successPoint;
    private int failPoint;
    private boolean active;

}
