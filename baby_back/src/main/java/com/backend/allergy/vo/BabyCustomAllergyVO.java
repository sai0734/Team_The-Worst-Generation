package com.backend.allergy.vo;


import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BabyCustomAllergyVO {
    private long customAllergyNo;
    private long babyNo;
    private String ingredientName;
    private LocalDateTime regTime;

}
