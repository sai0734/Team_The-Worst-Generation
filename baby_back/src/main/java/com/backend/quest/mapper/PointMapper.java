package com.backend.quest.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PointMapper {
    Integer selectPoint(@Param("email") String email);
    void upsertPoint(@Param("email") String email, @Param("amount") int amount);
    void insertLog(@Param("email") String email,
                   @Param("amount") int amount,
                   @Param("reason") String reason,
                   @Param("refId") Long refId);
    int sumMonthPoint(@Param("email") String email, @Param("yearMonth") String yearMonth);
}
