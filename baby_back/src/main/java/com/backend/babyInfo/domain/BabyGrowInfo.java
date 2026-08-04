package com.backend.babyInfo.domain;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@ToString
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
