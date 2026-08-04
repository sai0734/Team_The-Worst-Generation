package com.backend.babyInfo.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabyGrowInfo {

    // PK
    private Long babyGrowNo;

    // FK
    private Long babyNo;

    private LocalDate measuredDate;

    private Double weight;

    private Double height;

    private Double head;

    private LocalDateTime regTime;

}
