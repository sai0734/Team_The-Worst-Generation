package com.backend.babyInfo.domain;

import lombok.*;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class GrowthPercentile {

    // PK
    private Long percentileNo;

    private Integer ageMonth;

    private String gender;

    private Double avgWeightKg;

    private Double avgHeightCm;

}