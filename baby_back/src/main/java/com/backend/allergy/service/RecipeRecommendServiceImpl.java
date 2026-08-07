package com.backend.allergy.service;

import com.backend.allergy.domain.RecipeRecommend;

public interface RecipeRecommendServiceImpl {

    RecipeRecommend createRecipeRecommend(Long checkNo, String productType);
}
