package com.backend.aibeHavior.mapper;

import com.backend.aibeHavior.domain.BabyBehaviorStep;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabyBehaviorStepMapper {

    List<BabyBehaviorStep> selectListByConsultNo(@Param("consultNo") Long consultNo);

    void insert(BabyBehaviorStep step);

    void deleteByConsultNo(@Param("consultNo") Long consultNo);

}