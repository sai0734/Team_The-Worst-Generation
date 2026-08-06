package com.backend.babyInfo.mapper;

import com.backend.babyInfo.domain.BabyGrowInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabyGrowInfoMapper {

    List<BabyGrowInfo> selectList(@Param("babyNo") Long babyNo, @Param("email") String email);

    BabyGrowInfo selectByBabyGrowNo(@Param("babyGrowNo") Long babyGrowNo, @Param("email") String email);

    void insert(BabyGrowInfo babyGrowInfo);

    void remove(@Param("babyGrowNo") Long babyGrowNo, @Param("email") String email);

    void removeByBabyNo(@Param("babyNo") Long babyNo, @Param("email") String email);
}
