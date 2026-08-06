package com.backend.allergy.controller;


import com.backend.allergy.domain.BabyAllergyCheck;
import com.backend.allergy.service.AllergyCheckServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/allergy")
@RequiredArgsConstructor
public class AllergyCheckController {

    private final AllergyCheckServiceImpl allergyCheckServiceImpl;

    @PostMapping("/check")
    public ResponseEntity<BabyAllergyCheck> checkAllergy(
            @RequestParam("babyNo") Long babyNo,
            @RequestParam("image") MultipartFile image){

        BabyAllergyCheck result = allergyCheckServiceImpl.checkAllergy(babyNo, image);

        return ResponseEntity.ok(result);
    }
}
