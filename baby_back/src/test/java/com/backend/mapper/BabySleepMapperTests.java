package com.backend.mapper;

import com.backend.sleep.domain.BabySleep;
import com.backend.sleep.mapper.BabySleepMapper;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;

@SpringBootTest
@Log4j2
public class BabySleepMapperTests {

    @Autowired
    BabySleepMapper babySleepMapper;

    @Test
    public void insert() {

        for (int i = 0; i < 5; i++) {

            BabySleep babySleep = BabySleep.builder()
                    .babyNo(2L)
                    .sleepType(i % 2 == 0 ? "낮잠" : "밤잠")
                    .startTime(LocalDateTime.parse("2026-08-09T09:00:00").plusDays(i))
                    .endTime(LocalDateTime.parse("2026-08-09T10:30:00").plusDays(i))
                    .build();

            babySleepMapper.insert(babySleep);

            log.info(babySleep.toString());

        }

    }

    @Test
    public void getList() {

        List<BabySleep> babySleepList = babySleepMapper.selectList(2L, "user1@aaa.com");

        log.info(babySleepList.toString());

    }

    @Test
    public void getOne() {

        BabySleep babySleep = babySleepMapper.selectBySleepNo(1L, "user1@aaa.com");

        log.info(babySleep);

    }

    @Test
    public void update() {

        BabySleep babySleep = babySleepMapper.selectBySleepNo(1L, "user1@aaa.com");

        babySleep.changeSleepType("밤잠");
        babySleep.changeEndTime(LocalDateTime.parse("2026-08-09T11:00:00"));

        babySleepMapper.update(babySleep, "user1@aaa.com");

    }

    @Test
    public void delete() {

        babySleepMapper.delete(1L, "user1@aaa.com");

    }

    @Test
    public void deleteByBabyNo() {

        babySleepMapper.deleteByBabyNo(2L, "user1@aaa.com");

    }

}
