package com.backend.allergy.service;


import com.backend.allergy.client.VisionApiClient;
import com.backend.allergy.domain.AllergyIngredient;
import com.backend.allergy.domain.BabyAllergyCheck;
import com.backend.allergy.domain.BabyCustomAllergy;
import com.backend.allergy.mapper.AllergyIngredientMapper;
import com.backend.allergy.mapper.BabyAllergyCheckMapper;
import com.backend.allergy.mapper.BabyCustomAllergyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AllergyCheckService implements AllergyCheckServiceImpl {

    private final VisionApiClient visionApiClient;
    private final AllergyIngredientMapper allergyIngredientMapper;
    private final BabyCustomAllergyMapper babyCustomAllergyMapper;
    private final BabyAllergyCheckMapper babyAllergyCheckMapper;

    @Override
    public BabyAllergyCheck checkAllergy(Long babyNo, MultipartFile image) {

        byte[] imageBytes = readImageBytes(image);

        String ocrText = visionApiClient.extractText(imageBytes);

        String detectedAllergens = matchOfficialAllergens(ocrText);
        String detectedCustom = matchCustomAllergens(babyNo, ocrText);

        BabyAllergyCheck babyAllergyCheck = new BabyAllergyCheck();
        babyAllergyCheck.setBabyNo(babyNo);
        babyAllergyCheck.setImageFileName(image.getOriginalFilename());
        babyAllergyCheck.setOcrRawText(ocrText);
        babyAllergyCheck.setDetectedAllergens(detectedAllergens);
        babyAllergyCheck.setDetectedCustom(detectedCustom);

        babyAllergyCheckMapper.insertCheck(babyAllergyCheck);

        return babyAllergyCheck;
    }

    private byte[] readImageBytes(MultipartFile image) {
        try {
            return image.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("이미지 파일을 읽는 중 오류가 발생했습니다.", e);
        }
    }

    private String matchOfficialAllergens(String ocrText) {

        List<AllergyIngredient> allIngredients = allergyIngredientMapper.selectAll();
        List<String> matched = new ArrayList<>();

        for (AllergyIngredient ingredient : allIngredients) {
            if (ocrText.contains(ingredient.getIngredientName())) {
                matched.add(ingredient.getIngredientName());
            }
        }

        return String.join(",", matched);
    }

    private String matchCustomAllergens(Long babyNo, String ocrText) {

        List<BabyCustomAllergy> customList = babyCustomAllergyMapper.selectByBabyNo(babyNo);
        List<String> matched = new ArrayList<>();

        for (BabyCustomAllergy custom : customList) {
            if (ocrText.contains(custom.getIngredientName())) {
                matched.add(custom.getIngredientName());
            }
        }

        return String.join(",", matched);
    }
}