package com.backend.allergy.domain;


import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BabyCustomAllergy {
    private long customAllergyNo; //pk
    private long babyNo; // fk
    private String ingredientName;
    private LocalDateTime regTime;

}
