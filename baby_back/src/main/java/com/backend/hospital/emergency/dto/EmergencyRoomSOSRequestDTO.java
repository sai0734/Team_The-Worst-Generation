package com.backend.hospital.emergency.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class EmergencyRoomSOSRequestDTO {

    private double longitude;
    private double latitude;

    private String stage1;
    private String stage2;

    private int pageNo = 1;
    private int numOfRows = 10;

    private String testTargetPhone;
}