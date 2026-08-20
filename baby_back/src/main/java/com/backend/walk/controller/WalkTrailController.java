package com.backend.walk.controller;

import com.backend.walk.dto.WalkAiRecommendationDTO;
import com.backend.walk.service.WalkTrailServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk/trail")
public class WalkTrailController {

    private final WalkTrailServiceImpl walkTrailServiceImpl;

    @GetMapping("/ai-recommend")
    public WalkAiRecommendationDTO aiRecommend(
            @RequestParam double lat,
            @RequestParam double lng
    ) {
        return walkTrailServiceImpl.recommendWithAi(lat, lng);
    }
}