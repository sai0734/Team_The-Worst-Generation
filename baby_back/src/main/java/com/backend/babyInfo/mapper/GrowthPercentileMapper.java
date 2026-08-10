package com.backend.babyInfo.mapper;

import com.backend.babyInfo.domain.GrowthPercentile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface GrowthPercentileMapper {

    GrowthPercentile selectByAgeAndGender(@Param("ageMonth") Integer ageMonth, @Param("gender") String gender);

}