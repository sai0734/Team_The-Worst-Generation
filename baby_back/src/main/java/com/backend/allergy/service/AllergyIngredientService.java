package com.backend.allergy.service;

import com.backend.allergy.domain.AllergyIngredient;
import com.backend.allergy.mapper.AllergyIngredientMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AllergyIngredientService implements AllergyIngredientServiceImpl {

    private final AllergyIngredientMapper allergyIngredientMapper;

    @Override
    @Cacheable("allergyIngredients")
    public List<AllergyIngredient> getAllIngredients(){
        return allergyIngredientMapper.selectAll();
    }
}