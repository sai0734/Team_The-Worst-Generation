package com.backend.allergy.service;

import com.backend.allergy.domain.AllergyIngredient;

import java.util.List;

public interface AllergyIngredientServiceImpl {

    List<AllergyIngredient> getAllIngredients();
}
