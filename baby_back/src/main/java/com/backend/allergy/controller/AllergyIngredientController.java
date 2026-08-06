package com.backend.allergy.controller;


import com.backend.allergy.domain.AllergyIngredient;
import com.backend.allergy.service.AllergyIngredientServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/allergy/ingredient")
@RequiredArgsConstructor
public class AllergyIngredientController {

    private final AllergyIngredientServiceImpl allergyIngredientServiceImpl;

    @GetMapping
    public ResponseEntity<List<AllergyIngredient>> getAllIngredients(){

        List<AllergyIngredient> ingredients = allergyIngredientServiceImpl.getAllIngredients();

        return ResponseEntity.ok(ingredients);
    }
}
