package com.backend.aivideo.service;

import com.backend.aivideo.dto.AiVideoStatusDTO;

public interface AiVideoService {

    String generate(String content, byte[] imageBytes);

    AiVideoStatusDTO checkStatus(String taskId);

}