package com.backend.ledger.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LedgerSettingDTO {

    private String email;

    // 1~31, null이면 달력 기준(매월 1일) 사용
    private Integer briefingDay;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate lastBriefingCycleStart;

    // 프론트에서 배너 노출 여부 판단용: 이번 사이클 브리핑을 아직 안 받았으면 true
    private boolean briefingAvailable;
}
