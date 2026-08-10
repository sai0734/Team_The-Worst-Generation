package com.backend.cryCheck.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CryCheckDTO {

    private Long cryCheckNo;

    private Long babyNo;

    private Double avgPitch;
    private Double avgVolume;
    private Double durationSeconds;
    private String pattern;

    private String aiResultJson;

    private LocalDateTime regTime;
}
