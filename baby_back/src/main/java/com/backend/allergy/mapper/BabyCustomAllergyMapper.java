package com.backend.allergy.mapper;


import com.backend.allergy.domain.BabyCustomAllergy;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BabyCustomAllergyMapper {
    @Select("SELECT customAllergyNo, babyNo, ingredientName, regTime "
            + "FROM tbl_baby_custom_allergy WHERE babyNo = #{babyNo}")
    List<BabyCustomAllergy> selectByBabyNo(@Param("babyNo") Long babyNo);

    @Insert("INSERT INTO tbl_baby_custom_allergy (babyNo, ingredientName) "
            + "VALUES (#{babyNo}, #{ingredientName})")
    void insert(BabyCustomAllergy babyCustomAllergy);

    @Delete("DELETE FROM tbl_baby_custom_allergy WHERE customAllergyNo = #{customAllergyNo}")
    void remove(@Param("customAllergyNo") Long customAllergyNo);
}