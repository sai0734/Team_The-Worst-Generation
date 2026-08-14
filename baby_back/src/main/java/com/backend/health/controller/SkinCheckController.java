package com.backend.health.controller;

import com.backend.health.domain.BabySkinCheck;
import com.backend.health.service.BabySkinCheckServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/health/skin")
@RequiredArgsConstructor
public class SkinCheckController {

    private final BabySkinCheckServiceImpl babySkinCheckServiceImpl;

    @PostMapping
    public ResponseEntity<BabySkinCheck> checkSkin(
            @RequestParam("babyNo") Long babyNo,
            @RequestParam("image") MultipartFile image) {

        return ResponseEntity.ok(babySkinCheckServiceImpl.checkSkin(babyNo, image));
    }

    @GetMapping
    public ResponseEntity<List<BabySkinCheck>> getHistory(
            @RequestParam("babyNo") Long babyNo) {

        return ResponseEntity.ok(babySkinCheckServiceImpl.getHistory(babyNo));
    }
}