package com.backend.aivideo.service;

import com.backend.aivideo.dto.AiVideoStatusDTO;
import com.backend.aivideo.dto.AiVideoFallbackResultDTO;
import com.backend.global.ai.VideoGenerationClient;
import com.backend.global.ai.KlingClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Log4j2
public class AiVideoServiceImpl implements AiVideoService {

    private final KlingClient klingClient;

    private final VideoGenerationClient videoGenerationClient;

    @Override
    public String generate(String content, byte[] imageBytes) {

        log.info("aiVideo_Service_generate_실행~~~~~~~~~~~~");

        return klingClient.submitImageToVideo(content, imageBytes);

    }

    @Override
    public AiVideoStatusDTO checkStatus(String taskId) {

        log.info("aiVideo_Service_checkStatus_실행~~~~~~~~~~~~");

        KlingClient.TaskStatus taskStatus = klingClient.checkStatus(taskId);

        return AiVideoStatusDTO.builder()
                .status(taskStatus.status())
                .videoUrl(taskStatus.videoUrl())
                .build();

    }

    @Override
    public AiVideoFallbackResultDTO generateFallback(byte[] imageBytes, String narrationText) {

        log.info("aiVideo_Service_generateFallback_실행~~~~~~~~~~~~");

        VideoGenerationClient.VideoResult result = videoGenerationClient.generate(imageBytes, narrationText);

        return AiVideoFallbackResultDTO.builder()
                .fileName(result.fileName())
                .durationSeconds(result.durationSeconds())
                .build();

    }

}