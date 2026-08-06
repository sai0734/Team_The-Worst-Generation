package com.backend.mapper;

import com.backend.babyInfo.domain.BabyInfo;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.backend.babyInfo.mapper.BabyInfoMapper;

import java.time.LocalDate;
import java.util.List;

@SpringBootTest
@Log4j2
public class BabyInfoMapperTests {

    @Autowired
    BabyInfoMapper babyInfoMapper;

    @Test
    public void register() {

        for (int i = 0; i < 10; i++) {
            BabyInfo babyInfo = BabyInfo.builder()
                    .email("user" + i + "@aaa.com")
                    .babyName("응가" + i)
                    .birthDate(LocalDate.parse("2026-12-07"))
                    .gender("남자")
                    .bloodType("O형")
                    .birthWeekCount(10 + i)
                    .build();

            babyInfoMapper.insert(babyInfo, "user" + i + "@aaa.com");

            log.info(babyInfo.toString());
        }

    }

    @Test
    public void getList() {

        List<BabyInfo> babyInfoList = babyInfoMapper.selectList("user1@aaa.com");

        log.info(babyInfoList.toString());

    }

    @Test
    public void getOne() {

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(2L, "user1@aaa.com");

        log.info(babyInfo.toString());

    }

    @Test
    public void modify() {

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(2L, "user1@aaa.com");

        babyInfo.changeName("정서아");
        babyInfo.changeGender("여자");

        babyInfoMapper.update(babyInfo, "user1@aaa.com");

    }

    @Test
    public void remove() {
        babyInfoMapper.delete(11L, "user1@aaa.com");
    }
}
