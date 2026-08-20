package com.backend.aibeHavior.mapper;

import com.backend.aibeHavior.domain.BabyBehaviorConsult;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabyBehaviorConsultMapper {

    List<BabyBehaviorConsult> selectListByBaby(@Param("babyNo") Long babyNo, @Param("email") String email,
                                               @Param("skip") int skip, @Param("size") int size);

    long selectListCountByBaby(@Param("babyNo") Long babyNo, @Param("email") String email);

    BabyBehaviorConsult selectByConsultNo(@Param("consultNo") Long consultNo, @Param("email") String email);

    void insert(BabyBehaviorConsult consult);

    void delete(@Param("consultNo") Long consultNo, @Param("email") String email);

}
