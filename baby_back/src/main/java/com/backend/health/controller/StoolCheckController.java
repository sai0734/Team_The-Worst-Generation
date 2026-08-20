package com.backend.health.controller;


import com.backend.health.domain.BabyStoolCheck;
import com.backend.health.service.BabyStoolCheckServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/health/stool")
@RequiredArgsConstructor
public class StoolCheckController {

    private final BabyStoolCheckServiceImpl babyStoolCheckServiceImpl;

    @PostMapping
    public ResponseEntity<BabyStoolCheck> checkStool(
            @RequestParam("babyNo") Long babyNo,
            @RequestParam("image") MultipartFile image,
            Principal principal) {

        return ResponseEntity.ok(babyStoolCheckServiceImpl.checkStool(babyNo, image, principal.getName()));
    }

    @GetMapping
    public ResponseEntity<List<BabyStoolCheck>> getHistory(
            @RequestParam("babyNo") Long babyNo,
            Principal principal){

        return ResponseEntity.ok(babyStoolCheckServiceImpl.getHistory(babyNo, principal.getName()));
    }
}