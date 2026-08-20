package com.backend.allergy.mapper;


import com.backend.allergy.domain.BabyCustomAllergy;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BabyCustomAllergyMapper {
    @Select("SELECT customAllergyNo, babyNo, ingredientName, regTime "
            + "FROM tbl_baby_custom_allergy WHERE babyNo = #{babyNo}")
    List<BabyCustomAllergy> selectByBabyNo(@Param("babyNo") Long babyNo);

    @Select("SELECT customAllergyNo, babyNo, ingredientName, regTime "
            + "FROM tbl_baby_custom_allergy WHERE customAllergyNo = #{customAllergyNo}")
    BabyCustomAllergy selectByCustomAllergyNo(@Param("customAllergyNo") Long customAllergyNo);

    @Insert("INSERT INTO tbl_baby_custom_allergy (babyNo, ingredientName) "
            + "VALUES (#{babyNo}, #{ingredientName})")
    void insert(BabyCustomAllergy babyCustomAllergy);

    @Delete("DELETE FROM tbl_baby_custom_allergy WHERE customAllergyNo = #{customAllergyNo}")
    void remove(@Param("customAllergyNo") Long customAllergyNo);

    @Update("UPDATE tbl_baby_custom_allergy SET ingredientName = #{ingredientName} "
            + "WHERE customAllergyNo = #{customAllergyNo}")
    void update(@Param("customAllergyNo") Long customAllergyNo,
                @Param("ingredientName") String ingredientName);
}