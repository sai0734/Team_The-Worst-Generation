package com.backend.emergency.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EmergencyRoomLocationDTO {

    private String hpid;
    private String dutyName;
    private String dutyAddr;
    private String dutyDivName;
    private String dutyTel1;
    private Double latitude;
    private Double longitude;
    private Double distance;
    private String startTime;
    private String endTime;

}
