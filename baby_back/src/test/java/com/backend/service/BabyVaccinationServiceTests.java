package com.backend.service;

import com.backend.vaccination.dto.BabyVaccinationDTO;
import com.backend.vaccination.dto.VaccinationProgressDTO;
import com.backend.vaccination.service.BabyVaccinationService;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

@SpringBootTest
@Log4j2
public class BabyVaccinationServiceTests {

    @Autowired
    private BabyVaccinationService babyVaccinationService;

    @Test
    public void initSchedule() {

        babyVaccinationService.initSchedule(2L, "user1@aaa.com");

    }

    @Test
    public void registerCustom() {

        BabyVaccinationDTO babyVaccinationDTO = BabyVaccinationDTO.builder()
                .babyNo(2L)
                .vaccineName("독감 접종")
                .completed(false)
                .build();

        Long vaccinationNo = babyVaccinationService.registerCustom(babyVaccinationDTO, "user1@aaa.com");

        log.info("vaccinationNo: " + vaccinationNo);

    }

    @Test
    public void getList() {

        List<BabyVaccinationDTO> babyVaccinationDTOList = babyVaccinationService.getList(2L, "user1@aaa.com");

        log.info(babyVaccinationDTOList);

    }

    @Test
    public void completeCheck() {

        BabyVaccinationDTO babyVaccinationDTO = BabyVaccinationDTO.builder()
                .vaccinationNo(1L)
                .completed(true)
                .completedDate(LocalDate.parse("2026-08-09"))
                .hospitalName("서울소아과")
                .build();

        babyVaccinationService.completeCheck(babyVaccinationDTO, "user1@aaa.com");

    }

    @Test
    public void remove() {

        babyVaccinationService.remove(1L, "user1@aaa.com");

    }

    @Test
    public void getProgress() {

        VaccinationProgressDTO progress = babyVaccinationService.getProgress(2L, "user1@aaa.com");

        log.info(progress);

    }

}
