package com.backend.allergy.service;


import com.backend.allergy.domain.AllergyIngredient;
import com.backend.allergy.mapper.AllergyIngredientMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AllergyIngredientService implements AllergyIngredientServiceImpl {

    private final AllergyIngredientMapper allergyIngredientMapper;

    @Override
    public List<AllergyIngredient> getAllIngredients(){
        return allergyIngredientMapper.selectAll();
    }
}
