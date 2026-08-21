package com.backend.aibeHavior.mapper;

import com.backend.aibeHavior.domain.BabyBehaviorSource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabyBehaviorSourceMapper {

    List<BabyBehaviorSource> selectListByConsultNo(@Param("consultNo") Long consultNo);

    void insert(BabyBehaviorSource source);

    void deleteByConsultNo(@Param("consultNo") Long consultNo);

}