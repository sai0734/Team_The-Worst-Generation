package com.backend.health.mapper;

import com.backend.health.domain.BabySkinCheck;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface BabySkinCheckMapper {

    @Insert("INSERT INTO tbl_baby_skin_check (babyNo, imageFileName, aiResult) "
            + "VALUES (#{babyNo}, #{imageFileName}, #{aiResult})")
    @Options(useGeneratedKeys = true, keyProperty = "checkNo")
    void insertCheck(BabySkinCheck babySkinCheck);

    @Select("SELECT checkNo, babyNo, imageFileName, aiResult, regTime "
            + "FROM tbl_baby_skin_check WHERE babyNo = #{babyNo} ORDER BY checkNo DESC")
    List<BabySkinCheck> selectByBabyNo(@Param("babyNo") Long babyNo);
}