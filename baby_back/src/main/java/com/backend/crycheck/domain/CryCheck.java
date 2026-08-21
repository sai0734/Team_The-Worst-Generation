package com.backend.crycheck.domain;

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

    // 다시듣기용으로 저장된 오디오 파일명 (영상으로 올려도 오디오만 추출해서 저장됨)
    private String audioFileName;

    // 사용자가 나중에 알려준 실제 원인 (피드백 칩) - 처음엔 null
    private String userFeedback;

    private LocalDateTime regTime;
}
