package com.backend.aibeHavior.mapper;

import com.backend.aibeHavior.domain.BabyBehaviorMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabyBehaviorMessageMapper {

    List<BabyBehaviorMessage> selectListByConsultNo(@Param("consultNo") Long consultNo);

    void insert(BabyBehaviorMessage message);

    void deleteByConsultNo(@Param("consultNo") Long consultNo);

}