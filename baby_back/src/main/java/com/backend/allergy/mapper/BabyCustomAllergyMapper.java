package com.backend.allergy.mapper;


import com.backend.allergy.domain.BabyCustomAllergy;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BabyCustomAllergyMapper {
    @Select("SELECT custom_allergy_no, baby_no, ingredient_name, reg_time "
    + "FROM tbl_baby_custom_allergy WHERE baby_no = #{babyNo}")
    List<BabyCustomAllergy> selectByBabyNo(@Param("babyNo") Long babyNo);

    @Insert("INSERT INTO tbl_baby_custom_allergy (baby_no, ingredient_name) "
    + "VALUES (#{babyNo}, #{ingredientName})")
    void insert(BabyCustomAllergy babyCustomAllergy);

    @Delete("DELETE FROM tbl_baby_custom_allergy WHERE custom_allergy_no= #{customAllergyNo}")
    void remove(@Param("customAllergyNo") Long customAllergyNo);
}

