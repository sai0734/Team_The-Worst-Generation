package com.backend.sleep.mapper;

import com.backend.sleep.domain.BabySleep;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabySleepMapper {

    List<BabySleep> selectList(@Param("babyNo") Long babyNo, @Param("email") String email);

    BabySleep selectBySleepNo(@Param("sleepNo") Long sleepNo, @Param("email") String email);

    void insert(BabySleep babySleep);

    void update(@Param("sleep") BabySleep babySleep, @Param("email") String email);

    void delete(@Param("sleepNo") Long sleepNo, @Param("email") String email);

    void deleteByBabyNo(@Param("babyNo") Long babyNo, @Param("email") String email);

}