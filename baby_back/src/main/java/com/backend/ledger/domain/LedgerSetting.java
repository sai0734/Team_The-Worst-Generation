package com.backend.ledger.domain;

import java.time.LocalDate;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LedgerSetting {

    private String email;

    // 브리핑 기준일 (1~31, null이면 달력 기준 월 사용)
    private Integer briefingDay;

    // 마지막으로 브리핑을 생성한 사이클의 시작일
    private LocalDate lastBriefingCycleStart;

    public void changeBriefingDay(Integer briefingDay) {
        this.briefingDay = briefingDay;
    }

    public void changeLastBriefingCycleStart(LocalDate lastBriefingCycleStart) {
        this.lastBriefingCycleStart = lastBriefingCycleStart;
    }
}
