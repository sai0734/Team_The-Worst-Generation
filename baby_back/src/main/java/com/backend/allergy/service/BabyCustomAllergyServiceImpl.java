package com.backend.allergy.service;

import com.backend.allergy.domain.BabyCustomAllergy;

import java.util.List;

public interface BabyCustomAllergyServiceImpl {

    List<BabyCustomAllergy> getCustomAllergies(Long babyNo, String email);

    void addCustomAllergy(Long babyNo, String ingredientName, String email);

    void removeCustomAllergy(Long customAllergyNo, String email);

    void updateCustomAllergy(Long customAllergyNo, String ingredientName, String email);
}