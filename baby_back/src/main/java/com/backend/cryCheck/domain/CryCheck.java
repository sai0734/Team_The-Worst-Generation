package com.backend.cryCheck.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class CryCheck {

    // PK
    private Long cryCheckNo;

    // FK
    private Long babyNo;

    // 프론트 (Web Audio API) 에서 뽑아낸 음향 특징 - 브라우저 기본 내장
    private Double avgPitch;
    private Double avgVolume;
    private Double durationSeconds;
    private String pattern;

    // Ollama 응답 (순위별 의심 원인 JSON 원문)
    private String aiResultJson;

    private LocalDateTime regTime;
}
