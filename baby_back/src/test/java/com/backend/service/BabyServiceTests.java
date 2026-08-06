package com.backend.service;

import com.backend.babyInfo.dto.BabyInfoDTO;
import com.backend.babyInfo.service.BabyInfoService;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

@SpringBootTest
@Log4j2
public class BabyServiceTests {

    @Autowired
    private BabyInfoService babyInfoService;

    @Test
    public void register() {

        for(int i = 0; i < 10; i++) {

            BabyInfoDTO babyInfoDTO = BabyInfoDTO.builder()
                    .email("user" + i + "@aaa.com")
                    .babyName("사진쟁이" + i)
                    .birthDate(LocalDate.parse("2027-10-07"))
                    .gender("남자")
                    .bloodType("O형")
                    .birthWeekCount(37)
                    .build();

            babyInfoService.register(babyInfoDTO, "user1@aaa.com");

            log.info(babyInfoDTO.toString());

        }

    }

    @Test
    public void getList() {

        List<BabyInfoDTO> babyInfoDTOList = babyInfoService.getList("user1@aaa.com");

        log.info(babyInfoDTOList.toString());

    }

    @Test
    public void getOne() {

        BabyInfoDTO babyInfoDTO = babyInfoService.getBabyInfo(3L, "user1@aaa.com");

        log.info(babyInfoDTO.toString());

    }

    @Test
    public void modify() {

        BabyInfoDTO babyInfoDTO = BabyInfoDTO.builder()
                .babyNo(2L)
                .email("user" + 2 + "@aaa.com")
                .babyName("사진쟁이" + 222222)
                .birthDate(LocalDate.parse("2027-10-07"))
                .gender("여자")
                .bloodType("A형")
                .birthWeekCount(50)
                .build();

        babyInfoService.modify(babyInfoDTO, "user1@aaa.com");

        log.info(babyInfoDTO.toString());

    }

    @Test
    public void remove() {

        babyInfoService.remove(2L, "user1@aaa.com");

    }

}
