package com.backend.allergy.controller;


import com.backend.allergy.domain.BabyCustomAllergy;
import com.backend.allergy.service.BabyCustomAllergyServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/allergy/custom")
@RequiredArgsConstructor
public class BabyCustomAllergyController {

    private final BabyCustomAllergyServiceImpl babyCustomAllergyServiceImpl;

    @GetMapping
    public ResponseEntity<List<BabyCustomAllergy>> getCustomAllergies(
            @RequestParam("babyNo") Long babyNo,
            Principal principal){

        List<BabyCustomAllergy> result = babyCustomAllergyServiceImpl.getCustomAllergies(babyNo, principal.getName());

        return ResponseEntity.ok(result);
    }


    @PostMapping
    public ResponseEntity<Void> addCustomAllergy(
            @RequestParam("babyNo") Long babyNo,
            @RequestParam("ingredientName") String ingredientName,
            Principal principal){

        babyCustomAllergyServiceImpl.addCustomAllergy(babyNo, ingredientName, principal.getName());

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{customAllergyNo}")
    public ResponseEntity<Void> removeCustomAllergy(
            @PathVariable("customAllergyNo") Long customAllergyNo,
            Principal principal){

        babyCustomAllergyServiceImpl.removeCustomAllergy(customAllergyNo, principal.getName());

        return ResponseEntity.ok().build();
    }

    @PutMapping("/{customAllergyNo}")
    public ResponseEntity<Void> updateCustomAllergy(
            @PathVariable("customAllergyNo") Long customAllergyNo,
            @RequestParam("ingredientName") String ingredientName,
            Principal principal){

        babyCustomAllergyServiceImpl.updateCustomAllergy(customAllergyNo, ingredientName, principal.getName());

        return ResponseEntity.ok().build();
    }

}