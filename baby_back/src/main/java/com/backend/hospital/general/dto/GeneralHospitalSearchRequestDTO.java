package com.backend.hospital.general.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class GeneralHospitalSearchRequestDTO {

    private double longitude;
    private double latitude;

    private String stage1;
    private String stage2;

    private int pageNo = 1;
    private int numOfRows = 10;
}
