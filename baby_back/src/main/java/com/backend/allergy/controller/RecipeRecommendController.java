package com.backend.allergy.controller;


import com.backend.allergy.domain.RecipeRecommend;
import com.backend.allergy.service.RecipeRecommendServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/allergy/recipe")
@RequiredArgsConstructor
public class RecipeRecommendController {

    private final RecipeRecommendServiceImpl recipeRecommendServiceImpl;

    @PostMapping
    public ResponseEntity<RecipeRecommend> recommend(
            @RequestParam("checkNo") Long checkNo,
            @RequestParam("productType") String productType){

        RecipeRecommend result = recipeRecommendServiceImpl.createRecipeRecommend(checkNo,productType);

        return ResponseEntity.ok(result);
    }

}
