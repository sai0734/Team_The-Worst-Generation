package com.backend.assistant.service;

import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.dto.AssistRecommendresponse;

public interface AssistantService {
    AssistRecommendresponse recommend(AssistRecommendRequest request);
}
