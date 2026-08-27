package com.backend.aivideo.service;

import com.backend.aivideo.dto.AiVideoFallbackResultDTO;

public interface AiVideoService {

    AiVideoFallbackResultDTO generateFallback(byte[] imageBytes, String narrationText);

}