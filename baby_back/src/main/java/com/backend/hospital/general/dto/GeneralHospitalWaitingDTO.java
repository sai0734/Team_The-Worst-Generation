package com.backend.hospital.general.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GeneralHospitalWaitingDTO {

    private String hospitalId;
    private Integer waitingPatientCount;
    private Integer waitingChange;
}
