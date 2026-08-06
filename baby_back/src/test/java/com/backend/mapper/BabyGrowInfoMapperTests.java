package com.backend.mapper;

import com.backend.babyInfo.domain.BabyGrowInfo;
import com.backend.babyInfo.mapper.BabyGrowInfoMapper;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

@SpringBootTest
@Log4j2
public class BabyGrowInfoMapperTests {

    @Autowired
    BabyGrowInfoMapper babyGrowInfoMapper;

    @Test
    public void register() {

        for(Long i = 0L; i < 10L; i++) {

            BabyGrowInfo babyGrowInfo = BabyGrowInfo.builder()
                    .babyNo(i+2L)
                    .measuredDate(LocalDate.parse("2017-12-07"))
                    .weight(50.1)
                    .height(170.1)
                    .head(15.1)
                    .build();

            babyGrowInfoMapper.insert(babyGrowInfo);

            log.info(babyGrowInfo.toString());
        }

    }

    @Test
    public void getList() {

        List<BabyGrowInfo> babyGrowInfoList = babyGrowInfoMapper.selectList(2L, "user1@aaa.com");

        log.info(babyGrowInfoList.stream().toList());

    }

    @Test
    public void getOne() {

        BabyGrowInfo babyGrowInfo = babyGrowInfoMapper.selectByBabyGrowNo(2L, "user1@aaa.com");

        log.info(babyGrowInfo);

    }

    @Test
    public void remove() {

        babyGrowInfoMapper.remove(2L, "user1@aaa.com");

    }

}