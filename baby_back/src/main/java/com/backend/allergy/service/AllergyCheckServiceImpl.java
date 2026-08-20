package com.backend.allergy.service;

import com.backend.allergy.domain.BabyAllergyCheck;
import org.springframework.web.multipart.MultipartFile;

public interface AllergyCheckServiceImpl {

    BabyAllergyCheck checkAllergy(Long babyNo, MultipartFile image, String email);
}