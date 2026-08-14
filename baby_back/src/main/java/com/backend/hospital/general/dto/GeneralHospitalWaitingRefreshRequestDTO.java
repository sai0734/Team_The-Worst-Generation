package com.backend.hospital.general.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class GeneralHospitalWaitingRefreshRequestDTO {

    private List<String> hospitalIds;
}
