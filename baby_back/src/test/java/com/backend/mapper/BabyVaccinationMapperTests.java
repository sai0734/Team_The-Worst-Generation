package com.backend.mapper;

import com.backend.vaccination.domain.BabyVaccination;
import com.backend.vaccination.mapper.BabyVaccinationMapper;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

@SpringBootTest
@Log4j2
public class BabyVaccinationMapperTests {

    @Autowired
    BabyVaccinationMapper babyVaccinationMapper;

    @Test
    public void insertScheduleList() {

        babyVaccinationMapper.insertScheduleList(2L);

    }

    @Test
    public void insertCustom() {

        BabyVaccination babyVaccination = BabyVaccination.builder()
                .babyNo(2L)
                .vaccineName("꼬로나 접종")
                .completed(true)
                .completedDate(LocalDate.parse("2026-07-02"))
                .hospitalName("이젠소아과")
                .build();

        babyVaccinationMapper.insertCustom(babyVaccination);

        log.info(babyVaccination.toString());

    }

    @Test
    public void getList() {

        List<BabyVaccination> babyVaccinationList = babyVaccinationMapper.selectList(2L, "user1@aaa.com");

        log.info(babyVaccinationList.toString());

    }

    @Test
    public void getOne() {

        BabyVaccination babyVaccination = babyVaccinationMapper.selectByVaccinationNo(1L, "user1@aaa.com");

        log.info(babyVaccination);

    }

    @Test
    public void updateComplete() {

        BabyVaccination babyVaccination = babyVaccinationMapper.selectByVaccinationNo(1L, "user1@aaa.com");

        babyVaccination.changeCompleted(true);
        babyVaccination.changeCompletedDate(LocalDate.parse("2026-08-09"));
        babyVaccination.changeHospitalName("이젠소아과");

        babyVaccinationMapper.updateComplete(babyVaccination, "user1@aaa.com");

    }

    @Test
    public void delete() {

        babyVaccinationMapper.delete(1L, "user1@aaa.com");

    }

    @Test
    public void deleteByBabyNo() {

        babyVaccinationMapper.deleteByBabyNo(2L, "user1@aaa.com");

    }

}
