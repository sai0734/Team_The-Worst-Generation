package com.backend.aibeHavior.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabyBehaviorMessage {

    // PK
    private Long messageNo;

    // FK
    private Long consultNo;

    private String role;

    private String content;

    private LocalDateTime regTime;

}