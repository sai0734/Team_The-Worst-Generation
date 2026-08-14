package com.backend.hospital.emergency.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EmergencyRoomBedStatusDTO {

    private String hpid;
    private String dutyName;
    private String emergencyPhone;
    private Integer availableEmergencyBeds;
    private Integer operatingRoomAvailable;
    private Boolean pediatricVentiAvailable;
    private Boolean incubatorAvailable;
    private Boolean ctAvailable;
    private Boolean mriAvailable;
    private Boolean ventilatorAvailable;
    private String updatedAt;

}
