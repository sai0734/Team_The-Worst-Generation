package com.backend.emergency.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EmergencyRoomSOSResponseDTO {
    private String hospitalId;
    private String hospitalName;
    private String address;
    private String hospitalType;

    private String mainPhone;
    private String emergencyPhone;

    private Double distance;
    private Double latitude;
    private Double longitude;

    private String startTime;
    private String endTime;

    private Integer availableEmergencyBeds;
    private Integer availableOperatingRooms;

    private Boolean pediatricVentilatorAvailable;
    private Boolean incubatorAvailable;
    private Boolean ctAvailable;
    private Boolean mriAvailable;
    private Boolean ventilatorAvailable;

    private String updatedAt;
    private KakaoMapTargetDTO kakaoMapTarget;

    @Getter
    @Builder
    public static class KakaoMapTargetDTO {

        private String name;
        private Double latitude;
        private Double longitude;
    }
}
