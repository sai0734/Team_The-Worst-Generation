package com.backend.hospital.general.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class GeneralHospitalWaitingRefreshResultDTO {

    private boolean refreshLimited;
    private int retryAfterSeconds;
    private List<GeneralHospitalWaitingDTO> hospitals;
}
