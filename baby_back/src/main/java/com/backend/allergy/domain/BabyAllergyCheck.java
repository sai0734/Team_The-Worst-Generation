package com.backend.allergy.domain;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BabyAllergyCheck {

    private Long checkNo; //pk
    private Long babyNo; // fk
    private String imageFileName;
    private String ocrRawText;
    private String detectedAllergens;
    private String detectedCustom;
    private LocalDateTime regTime;
}