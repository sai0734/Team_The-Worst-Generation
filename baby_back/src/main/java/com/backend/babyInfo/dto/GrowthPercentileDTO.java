package com.backend.babyInfo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GrowthPercentileDTO {

    // PK
    private Long percentileNo;

    private Integer ageMonth;

    private String gender;

    private Double avgWeightKg;

    private Double avgHeightCm;

}