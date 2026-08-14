package com.backend.health.controller;


import com.backend.health.domain.BabyStoolCheck;
import com.backend.health.service.BabyStoolCheckServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/health/stool")
@RequiredArgsConstructor
public class StoolCheckController {

    private final BabyStoolCheckServiceImpl babyStoolCheckServiceImpl;

    @PostMapping
    public ResponseEntity<BabyStoolCheck> checkStool(
            @RequestParam("babyNo") Long babyNo,
            @RequestParam("image") MultipartFile image) {

        return ResponseEntity.ok(babyStoolCheckServiceImpl.checkStool(babyNo, image));
    }

    @GetMapping
    public ResponseEntity<List<BabyStoolCheck>> getHistory(
            @RequestParam("babyNo") Long babyNo){

        return ResponseEntity.ok(babyStoolCheckServiceImpl.getHistory(babyNo));
    }
}
