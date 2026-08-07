package com.backend.babyInfo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabyGrowInfoDTO {

    // PK
    private Long babyGrowNo;

    // FK
    private Long babyNo;

    private LocalDate measuredDate;

    private Double weight;

    private Double height;

    private LocalDateTime regTime;

}
