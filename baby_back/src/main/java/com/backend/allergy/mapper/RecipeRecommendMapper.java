package com.backend.allergy.mapper;


import com.backend.allergy.domain.RecipeRecommend;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface RecipeRecommendMapper {

    @Insert("INSERT INTO tbl_recipe_recommend (checkNo, productType, recommendedRecipe) "
            + "VALUES (#{checkNo}, #{productType}, #{recommendRecipe})")
    @Options(useGeneratedKeys = true, keyProperty = "recommendNo")
    void insert(RecipeRecommend recipeRecommend);

    @Select("SELECT recommendNo, checkNo, productType, recommendedRecipe AS recommendRecipe, regTime "
            + "FROM tbl_recipe_recommend WHERE checkNo = #{checkNo}")
    List<RecipeRecommend> selectByCheckNo(@Param("checkNo") Long checkNo);
}