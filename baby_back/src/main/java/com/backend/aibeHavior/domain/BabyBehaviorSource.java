package com.backend.aibeHavior.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabyBehaviorSource {

    // PK
    private Long sourceNo;

    // FK
    private Long consultNo;

    private String title;

    private String link;

    private String press;

    private String pubDate;

    private LocalDateTime regTime;

}