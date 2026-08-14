package com.backend.assistant.service;

import com.backend.assistant.domain.AssistRegion;
import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.dto.AssistRecommendresponse;

public interface AssistantService {
    AssistRecommendresponse recommend(AssistRecommendRequest request);
    AssistRecommendresponse loadSnapshot(String email);
    void saveRegion(String email, String regionSido, String regionSigungu);
    AssistRegion loadRegion(String email);
}
