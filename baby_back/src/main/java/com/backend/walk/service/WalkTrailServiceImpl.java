package com.backend.walk.service;

import com.backend.walk.dto.WalkAiRecommendationDTO;

public interface WalkTrailServiceImpl {
    WalkAiRecommendationDTO recommendWithAi(double lat, double lng);
}