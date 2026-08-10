package com.backend.allergy.service;

import com.backend.allergy.domain.BabyCustomAllergy;

import java.util.List;

public interface BabyCustomAllergyServiceImpl {

    List<BabyCustomAllergy> getCustomAllergies(Long babyNo);

    void addCustomAllergy(Long babyNo, String ingredientName);

    void removeCustomAllergy(Long customAllergyNo);
}
