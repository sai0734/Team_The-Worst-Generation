package com.backend.allergy.vo;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BabyAllergyCheckVO {

    private Long checkNo;
    private Long babyNo;
    private String imageFileName;
    private String ocrRawText;
    private String detectedAllergens;
    private String detectedCustom;
    private LocalDateTime regTime;
}