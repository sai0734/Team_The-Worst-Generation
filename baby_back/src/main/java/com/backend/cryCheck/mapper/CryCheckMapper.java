package com.backend.cryCheck.mapper;

import com.backend.cryCheck.domain.CryCheck;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CryCheckMapper {

    void insert(CryCheck cryCheck);

    CryCheck selectByCheckNo(@Param("cryCheckNo") Long cryCheckNo, @Param("email") String email);

    List<CryCheck> selectListByBaby(@Param("babyNo") Long babyNo, @Param("email") String email);
}
