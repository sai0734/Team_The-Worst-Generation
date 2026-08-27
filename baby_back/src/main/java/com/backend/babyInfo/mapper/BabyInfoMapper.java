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

    // 추가 시작 - babyNo와 연결된 18개 테이블을 한 번의 SQL로 캐스케이드 삭제
    void deleteCascade(@Param("babyNo") Long babyNo, @Param("email") String email);
    // 추가 끝

}
