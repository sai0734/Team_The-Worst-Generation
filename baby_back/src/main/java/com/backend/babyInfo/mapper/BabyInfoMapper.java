package com.backend.babyInfo.mapper;

import com.backend.babyInfo.domain.BabyInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabyInfoMapper {

    List<BabyInfo> selectList(@Param("email") String email);

    BabyInfo selectByBabyNo(@Param("babyNo") Long babyNo, @Param("email") String email);

    void insert(@Param("babyInfo") BabyInfo babyInfo, @Param("email") String email);

    void update(@Param("babyInfo") BabyInfo babyInfo, @Param("email") String email);

    void delete(@Param("babyNo") Long babyNo, @Param("email") String email);

    // babyNo와 연결된 18개 테이블을 손자→자식→부모 순서로 캐스케이드 삭제
    void deleteCascadeGrandchildren(@Param("babyNo") Long babyNo, @Param("email") String email);

    void deleteCascade(@Param("babyNo") Long babyNo, @Param("email") String email);

}
