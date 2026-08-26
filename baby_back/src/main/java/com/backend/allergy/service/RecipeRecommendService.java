package com.backend.allergy.service;


import com.backend.allergy.domain.BabyAllergyCheck;
import com.backend.allergy.domain.RecipeRecommend;
import com.backend.allergy.mapper.BabyAllergyCheckMapper;
import com.backend.allergy.mapper.RecipeRecommendMapper;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.global.ai.OllamaClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecipeRecommendService implements RecipeRecommendServiceImpl {

    private final OllamaClient ollamaClient;
    private final BabyAllergyCheckMapper babyAllergyCheckMapper;
    private final RecipeRecommendMapper recipeRecommendMapper;
    private final BabyInfoMapper babyInfoMapper;

    @Override
    public RecipeRecommend createRecipeRecommend(Long checkNo, String productType, String email){

        BabyAllergyCheck babyAllergyCheck = babyAllergyCheckMapper.selectByCheckNo(checkNo);

        if (babyAllergyCheck == null) {
            throw new IllegalArgumentException("존재하지 않는 검사 기록입니다: " + checkNo);
        }

        if (babyInfoMapper.selectByBabyNo(babyAllergyCheck.getBabyNo(), email) == null) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        String prompt = buildPrompt(babyAllergyCheck, productType);

        String recipeText = ollamaClient.chat(prompt, 1.0);

        RecipeRecommend recipeRecommend = new RecipeRecommend();
        recipeRecommend.setCheckNo(checkNo);
        recipeRecommend.setProductType(productType);
        recipeRecommend.setRecommendRecipe(recipeText);

        recipeRecommendMapper.insert(recipeRecommend);

        return recipeRecommend;
    }

    private String buildPrompt(BabyAllergyCheck babyAllergyCheck, String productType){

        StringBuilder sb = new StringBuilder();
        sb.append("아기용 ").append(productType).append(" 레시피를 추천해줘.\n")
                .append("반드시 '").append(productType).append("' 카테고리에 맞는 레시피여야 해 (예: 이유식=부드럽게 으깨거나 무른 형태의 유아식, 간식=아이가 손으로 집어먹기 좋은 작은 간식, 국=국물이 있는 국/탕 요리). ")
                .append("이유식·간식·국을 각각 추천받을 때마다 매번 서로 다른 요리와 재료로 다양하게 제안해줘.\n");

        if(babyAllergyCheck.getDetectedAllergens()!=null && !babyAllergyCheck.getDetectedAllergens().isBlank()){
            sb.append("다음 알레르기 유발 성분은 반드시 피해줘: ")
                    .append(babyAllergyCheck.getDetectedAllergens()).append("\n");
        }

        if (babyAllergyCheck.getDetectedCustom()!= null && !babyAllergyCheck.getDetectedCustom().isBlank()){
            sb.append("추가로 이 성분도 피해줘: ")
                    .append(babyAllergyCheck.getDetectedCustom()).append("\n");
        }

        sb.append("\n다음 JSON 형식으로만 답해줘. 코드블록 표시(```)나 다른 설명 없이 순수 JSON 객체 하나만 출력해:\n")
                .append("{\"recipeName\": \"레시피 이름\", \"ingredients\": [\"재료1\", \"재료2\"], \"instructions\": \"조리 방법을 한국어로 간단히 설명\"}");

        return sb.toString();
    }
}