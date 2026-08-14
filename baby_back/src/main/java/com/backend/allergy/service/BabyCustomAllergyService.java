package com.backend.allergy.service;


import com.backend.allergy.domain.BabyCustomAllergy;
import com.backend.allergy.mapper.BabyCustomAllergyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BabyCustomAllergyService implements BabyCustomAllergyServiceImpl{

    private final BabyCustomAllergyMapper babyCustomAllergyMapper;

    @Override
    public List<BabyCustomAllergy> getCustomAllergies(Long babyNo){
        return babyCustomAllergyMapper.selectByBabyNo(babyNo);
    }

    @Override
    public void addCustomAllergy(Long babyNo, String ingredientName){

        BabyCustomAllergy babyCustomAllergy = new BabyCustomAllergy();
        babyCustomAllergy.setBabyNo(babyNo);
        babyCustomAllergy.setIngredientName(ingredientName);

        babyCustomAllergyMapper.insert(babyCustomAllergy);
    }

    @Override
    public void removeCustomAllergy(Long customAllergyNo){
        babyCustomAllergyMapper.remove(customAllergyNo);
    }

    @Override
    public void updateCustomAllergy(Long customAllergyNo, String ingredientName){
        babyCustomAllergyMapper.update(customAllergyNo, ingredientName);
    }
}
