package com.backend.service;

import com.backend.babyInfo.dto.BabyGrowInfoDTO;
import com.backend.babyInfo.service.BabyGrowInfoService;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

@SpringBootTest
@Log4j2
public class BabyGrowInfoServiceTests {

    @Autowired
    private BabyGrowInfoService babyGrowInfoService;

    @Test
    public void register() {

        for(Long i = 1L; i < 9L; i++) {

            BabyGrowInfoDTO babyGrowInfoDTO = BabyGrowInfoDTO.builder()
                    .babyNo(i)
                    .measuredDate(LocalDate.parse("2017-12-07"))
                    .weight(50.1 + i)
                    .height(170.1 + i)
                    .build();

            babyGrowInfoService.register(babyGrowInfoDTO, "user1@aaa.com");

            log.info(babyGrowInfoDTO);

        }

    }

    @Test
    public void getList() {

        List<BabyGrowInfoDTO> babyGrowInfoDTOList = babyGrowInfoService.getList(2L, "user1@aaa.com");

        log.info(babyGrowInfoDTOList);

    }

    @Test void getOne() {

        BabyGrowInfoDTO babyGrowInfoDTO = babyGrowInfoService.getBabyGrowInfo(1L, "user1@aaa.com");

        log.info(babyGrowInfoDTO.toString());

    }

    @Test
    public void remove() {

        babyGrowInfoService.remove(1L, "user1@aaa.com");

    }

    @Test
    public void removeAll() {

        babyGrowInfoService.removeAll(3L, "user1@aaa.com");

    }

}