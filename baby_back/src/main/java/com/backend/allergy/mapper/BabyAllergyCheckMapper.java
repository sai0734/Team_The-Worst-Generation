package com.backend.allergy.mapper;


import com.backend.allergy.domain.BabyAllergyCheck;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;


@Mapper
public interface BabyAllergyCheckMapper {

    @Insert("INSERT INTO tbl_baby_allergy_check "
            + "(babyNo, imageFileName, ocrRawText, detectedAllergens, detectedCustom) "
            + "VALUES (#{babyNo}, #{imageFileName}, #{ocrRawText}, #{detectedAllergens}, #{detectedCustom})")
    @Options(useGeneratedKeys = true, keyProperty = "checkNo")
    void insertCheck(BabyAllergyCheck babyAllergyCheck);

    @Select("SELECT checkNo, babyNo, imageFileName, ocrRawText, detectedAllergens, detectedCustom, regTime "
            + "FROM tbl_baby_allergy_check WHERE checkNo = #{checkNo}")
    BabyAllergyCheck selectByCheckNo(@Param("checkNo") Long checkNo);
}