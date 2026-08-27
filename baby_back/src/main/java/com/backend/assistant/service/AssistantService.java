package com.backend.assistant.service;

import com.backend.assistant.domain.AssistRegion;
import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.dto.AssistRecommendresponse;

public interface AssistantService {
    AssistRecommendresponse ask(AssistRecommendRequest request);
    void saveRegion(String email, String regionSido, String regionSigungu, Integer babyMonths);
    AssistRegion loadRegion(String email);
}
