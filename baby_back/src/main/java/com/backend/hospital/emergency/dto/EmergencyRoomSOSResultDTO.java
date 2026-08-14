package com.backend.hospital.emergency.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class EmergencyRoomSOSResultDTO {

    private EmergencyRoomSOSResponseDTO selectedHospital;
    private OpenClawPayloadDTO openClawPayload;
    private List<EmergencyRoomSOSResponseDTO> candidates;

    @Getter
    @Builder
    public static class OpenClawPayloadDTO {

        private String callTargetPhone;
        private String actualEmergencyPhone;

        private String hospitalId;
        private String hospitalName;
        private String address;

        private Double latitude;
        private Double longitude;

        private Integer availableEmergencyBeds;
        private Boolean pediatricVentilatorAvailable;
        private Boolean incubatorAvailable;

        private String callScript;
    }
}