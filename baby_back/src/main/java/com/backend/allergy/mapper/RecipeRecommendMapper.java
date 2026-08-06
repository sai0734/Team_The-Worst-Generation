package com.backend.allergy.mapper;


import com.backend.allergy.domain.RecipeRecommend;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface RecipeRecommendMapper {

    @Insert("INSERT INTO tbl_recipe_recommend (check_no, product_type, recommended_recipe) "
            + "VALUES (#{checkNo}, #{productType}, #{recommendedRecipe})")
    @Options(useGeneratedKeys = true, keyProperty = "recommendNo")
    void insert(RecipeRecommend recipeRecommend);

    @Select("SELECT recommend_no, check_no, product_type, recommended_recipe, reg_time "
            + "FROM tbl_recipe_recommend WHERE check_no = #{checkNo}")
    List<RecipeRecommend> selectByCheckNo(@Param("checkNo") Long checkNo);
}