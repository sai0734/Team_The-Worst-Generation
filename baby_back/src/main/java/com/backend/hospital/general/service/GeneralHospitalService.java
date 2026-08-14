package com.backend.hospital.general.service;

import com.backend.hospital.general.dto.GeneralHospitalResponseDTO;
import com.backend.hospital.general.dto.GeneralHospitalWaitingRefreshResultDTO;

import java.util.List;

public interface GeneralHospitalService {

    List<GeneralHospitalResponseDTO> searchHospitals(
            double longitude,
            double latitude,
            String stage1,
            String stage2,
            int pageNo,
            int numOfRows
    );

    GeneralHospitalWaitingRefreshResultDTO refreshWaitingCounts(
            String memberEmail,
            List<String> hospitalIds
    );
}
