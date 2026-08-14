package com.backend.health.mapper;

import com.backend.health.domain.BabyStoolCheck;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface BabyStoolCheckMapper {

    @Insert("INSERT INTO tbl_baby_stool_check (babyNo, imageFileName, aiResult) "
            + "VALUES (#{babyNo}, #{imageFileName}, #{aiResult})")
    @Options(useGeneratedKeys = true, keyProperty = "checkNo")
    void insertCheck(BabyStoolCheck babyStoolCheck);

    @Select("SELECT checkNo, babyNo, imageFileName, aiResult, regTime "
            + "FROM tbl_baby_stool_check WHERE babyNo = #{babyNo} ORDER BY checkNo DESC")
    List<BabyStoolCheck> selectByBabyNo(@Param("babyNo") Long babyNo);
}