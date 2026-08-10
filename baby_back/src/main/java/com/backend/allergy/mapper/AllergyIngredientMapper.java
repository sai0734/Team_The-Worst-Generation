package com.backend.allergy.mapper;

import com.backend.allergy.domain.AllergyIngredient;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;


@Mapper
public interface AllergyIngredientMapper {

    @Select("SELECT ingredientNo, ingredientName FROM tbl_allergy_ingredient")
    List<AllergyIngredient> selectAll();
}
