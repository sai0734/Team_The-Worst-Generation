package com.backend.hospital.general.controller;

import com.backend.hospital.general.dto.GeneralHospitalResponseDTO;
import com.backend.hospital.general.dto.GeneralHospitalSearchRequestDTO;
import com.backend.hospital.general.dto.GeneralHospitalWaitingRefreshRequestDTO;
import com.backend.hospital.general.dto.GeneralHospitalWaitingRefreshResultDTO;
import com.backend.hospital.general.service.GeneralHospitalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
public class GeneralHospitalController {

    private final GeneralHospitalService generalHospitalService;

    @PostMapping("/search")
    public List<GeneralHospitalResponseDTO> searchHospitals(
            @RequestBody GeneralHospitalSearchRequestDTO request
    ) {
        return generalHospitalService.searchHospitals(
                request.getLongitude(),
                request.getLatitude(),
                request.getStage1(),
                request.getStage2(),
                request.getPageNo(),
                request.getNumOfRows()
        );
    }

    @PostMapping("/waiting/refresh")
    public GeneralHospitalWaitingRefreshResultDTO refreshWaitingCounts(
            Principal principal,
            @RequestBody GeneralHospitalWaitingRefreshRequestDTO request
    ) {
        String memberEmail = principal == null ? null : principal.getName();
        return generalHospitalService.refreshWaitingCounts(memberEmail, request.getHospitalIds());
    }
}
