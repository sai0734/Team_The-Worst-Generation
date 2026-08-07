package com.backend.allergy.service;


import com.backend.allergy.domain.BabyAllergyCheck;
import com.backend.allergy.domain.RecipeRecommend;
import com.backend.allergy.mapper.BabyAllergyCheckMapper;
import com.backend.allergy.mapper.RecipeRecommendMapper;
import com.backend.ledger.ai.OllamaClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecipeRecommendService implements RecipeRecommendServiceImpl {

    private final OllamaClient ollamaClient;
    private final BabyAllergyCheckMapper babyAllergyCheckMapper;
    private final RecipeRecommendMapper recipeRecommendMapper;

    @Override
    public RecipeRecommend createRecipeRecommend(Long checkNo, String productType){

        BabyAllergyCheck babyAllergyCheck = babyAllergyCheckMapper.selectByCheckNo(checkNo);

        String prompt = buildPrompt(babyAllergyCheck, productType);

        String recipeText = ollamaClient.chat(prompt);

        RecipeRecommend recipeRecommend = new RecipeRecommend();
        recipeRecommend.setCheckNo(checkNo);
        recipeRecommend.setProductType(productType);
        recipeRecommend.setRecommendRecipe(recipeText);

        recipeRecommendMapper.insert(recipeRecommend);

        return recipeRecommend;
    }

    private String buildPrompt(BabyAllergyCheck babyAllergyCheck, String productType){

        StringBuilder sb = new StringBuilder();
        sb.append("아기용").append(productType).append("레시피를 추천해줘. \n");

        if(babyAllergyCheck.getDetectedCustom()!=null && !babyAllergyCheck.getDetectedAllergens().isBlank()){
            sb.append("다음 알레르기 유발 성분은 반드시 피해줘: ")
                    .append(babyAllergyCheck.getDetectedAllergens()).append("\n");
        }

        if (babyAllergyCheck.getDetectedCustom()!= null && !babyAllergyCheck.getDetectedCustom().isBlank()){
            sb.append("추가로 이 성분도 피해줘: ")
                    .append(babyAllergyCheck.getDetectedCustom()).append("\n");
        }

        sb.append("레시피 이름, 재료 조리 방법을 간단히 알려줘.");

        return sb.toString();
    }
}
