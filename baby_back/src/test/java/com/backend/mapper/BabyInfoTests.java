package com.backend.mapper;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.backend.babyInfo.mapper.BabyInfoMapper;

@SpringBootTest
@Log4j2
public class BabyInfoTests {

    @Autowired
    MemberMapper memberMapper;

    @Autowired
    BabyInfoMapper babyInfoMapper;

    @Test
    public void getList() {

        String email = memberMapper.selectByEmail("user1@aaa.com").getEmail();





    }

}
