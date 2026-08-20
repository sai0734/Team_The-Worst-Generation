package com.backend.crycheck.mapper;

import com.backend.crycheck.domain.CryCheck;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CryCheckMapper {

    void insert(CryCheck cryCheck);

    CryCheck selectByCheckNo(@Param("cryCheckNo") Long cryCheckNo, @Param("email") String email);

    List<CryCheck> selectListByBaby(@Param("babyNo") Long babyNo, @Param("email") String email);

    void updateFeedback(@Param("cryCheckNo") Long cryCheckNo, @Param("userFeedback") String userFeedback);

    void delete(@Param("cryCheckNo") Long cryCheckNo);
}
