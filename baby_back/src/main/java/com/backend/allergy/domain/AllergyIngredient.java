package com.backend.allergy.domain;


import lombok.Data;

@Data
public class AllergyIngredient {

    private long ingredientNo; // pk
    private String ingredientName;
}
