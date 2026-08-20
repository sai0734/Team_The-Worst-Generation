package com.backend.aibeHavior.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabyBehaviorConsult {

    // PK
    private Long consultNo;

    // FK
    private Long babyNo;

    private String category;

    private String situation;

    private String aiSummary;

    private String videoId;

    private String videoTitle;

    private LocalDateTime regTime;

}
