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
            + "(baby_no, image_file_name, ocr_raw_text, detected_allergens, detected_custom, mixing_instruction) "
            + "VALUES (#{babyNo}, #{imageFileName}, #{ocrRawText}, #{detectedAllergens}, #{detectedCustom}, #{mixingInstruction})")
    @Options(useGeneratedKeys = true, keyProperty = "checkNo")
    void insertCheck(BabyAllergyCheck babyAllergyCheck);

    @Select("SELECT check_no, baby_no, image_file_name, ocr_raw_text, detected_allergens, detected_custom, "
            + "mixing_instruction, reg_time "
            + "FROM tbl_baby_allergy_check WHERE check_no = #{checkNo}")
    BabyAllergyCheck selectByCheckNo(@Param("checkNo") Long checkNo);
}