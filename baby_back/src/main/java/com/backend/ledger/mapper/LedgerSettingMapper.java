package com.backend.ledger.mapper;

import java.time.LocalDate;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.ledger.domain.LedgerSetting;

@Mapper
public interface LedgerSettingMapper {

    LedgerSetting selectByEmail(@Param("email") String email);

    void insert(LedgerSetting setting);

    void updateBriefingDay(@Param("email") String email, @Param("briefingDay") Integer briefingDay);

    void updateLastBriefingCycleStart(
        @Param("email") String email,
        @Param("cycleStart") LocalDate cycleStart
    );
}
