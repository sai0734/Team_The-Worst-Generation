package com.backend.vaccination.service;

import com.backend.vaccination.dto.BabyVaccinationDTO;
import com.backend.vaccination.dto.VaccinationProgressDTO;

import java.util.List;

public interface BabyVaccinationService {

    List<BabyVaccinationDTO> getList(Long babyNo, String email);

    void initSchedule(Long babyNo, String email);

    void completeCheck(BabyVaccinationDTO babyVaccinationDTO, String email);

    Long registerCustom(BabyVaccinationDTO babyVaccinationDTO, String email);

    void remove(Long vaccinationNo, String email);

    VaccinationProgressDTO getProgress(Long babyNo, String email);

}