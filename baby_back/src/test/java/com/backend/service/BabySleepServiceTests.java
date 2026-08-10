package com.backend.service;

import com.backend.sleep.dto.BabySleepDTO;
import com.backend.sleep.service.BabySleepService;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;

@SpringBootTest
@Log4j2
public class BabySleepServiceTests {

    @Autowired
    private BabySleepService babySleepService;

    @Test
    public void register() {

        BabySleepDTO babySleepDTO = BabySleepDTO.builder()
                .babyNo(2L)
                .sleepType("낮잠")
                .startTime(LocalDateTime.parse("2026-08-09T09:00:00"))
                .endTime(LocalDateTime.parse("2026-08-09T10:30:00"))
                .build();

        Long sleepNo = babySleepService.register(babySleepDTO, "user1@aaa.com");

        log.info("sleepNo: " + sleepNo);

    }

    @Test
    public void getList() {

        List<BabySleepDTO> babySleepDTOList = babySleepService.getList(2L, "user1@aaa.com");

        log.info(babySleepDTOList);

    }

    @Test
    public void modify() {

        BabySleepDTO babySleepDTO = BabySleepDTO.builder()
                .sleepNo(1L)
                .sleepType("밤잠")
                .startTime(LocalDateTime.parse("2026-08-09T21:00:00"))
                .endTime(LocalDateTime.parse("2026-08-10T06:00:00"))
                .build();

        babySleepService.modify(babySleepDTO, "user1@aaa.com");

    }

    @Test
    public void remove() {

        babySleepService.remove(1L, "user1@aaa.com");

    }

}
