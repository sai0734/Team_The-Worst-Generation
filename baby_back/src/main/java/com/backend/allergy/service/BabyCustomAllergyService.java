package com.backend.allergy.service;


import com.backend.allergy.domain.BabyCustomAllergy;
import com.backend.allergy.mapper.BabyCustomAllergyMapper;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BabyCustomAllergyService implements BabyCustomAllergyServiceImpl{

    private final BabyCustomAllergyMapper babyCustomAllergyMapper;
    private final BabyInfoMapper babyInfoMapper;

    @Override
    public List<BabyCustomAllergy> getCustomAllergies(Long babyNo, String email){
        verifyOwner(babyNo, email);
        return babyCustomAllergyMapper.selectByBabyNo(babyNo);
    }

    @Override
    public void addCustomAllergy(Long babyNo, String ingredientName, String email){
        verifyOwner(babyNo, email);

        BabyCustomAllergy babyCustomAllergy = new BabyCustomAllergy();
        babyCustomAllergy.setBabyNo(babyNo);
        babyCustomAllergy.setIngredientName(ingredientName);

        babyCustomAllergyMapper.insert(babyCustomAllergy);
    }

    @Override
    public void removeCustomAllergy(Long customAllergyNo, String email){
        verifyOwnerOfCustomAllergy(customAllergyNo, email);
        babyCustomAllergyMapper.remove(customAllergyNo);
    }

    @Override
    public void updateCustomAllergy(Long customAllergyNo, String ingredientName, String email){
        verifyOwnerOfCustomAllergy(customAllergyNo, email);
        babyCustomAllergyMapper.update(customAllergyNo, ingredientName);
    }

    private void verifyOwner(Long babyNo, String email) {
        if (babyInfoMapper.selectByBabyNo(babyNo, email) == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyNo);
        }
    }

    private void verifyOwnerOfCustomAllergy(Long customAllergyNo, String email) {
        BabyCustomAllergy existing = babyCustomAllergyMapper.selectByCustomAllergyNo(customAllergyNo);
        if (existing == null) {
            throw new IllegalArgumentException("존재하지 않는 알레르기 성분입니다: " + customAllergyNo);
        }
        verifyOwner(existing.getBabyNo(), email);
    }
}