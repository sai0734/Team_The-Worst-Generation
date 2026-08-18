package com.backend.aivideo.controller;

import com.backend.aivideo.dto.AiVideoStatusDTO;
import com.backend.aivideo.service.AiVideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai-video")
@Log4j2
public class AiVideoController {

    private final AiVideoService aiVideoService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/generate")
    public Map<String, String> generate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("content") String content) {

        log.info("aiVideo_Controller_generate_실행~~~~~~~~~~~~");

        byte[] imageBytes;
        try {
            imageBytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("이미지 파일을 읽는 중 오류가 발생했습니다.", e);
        }

        String taskId = aiVideoService.generate(content, imageBytes);

        return Map.of("taskId", taskId);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/status/{taskId}")
    public AiVideoStatusDTO status(@PathVariable("taskId") String taskId) {

        log.info("aiVideo_Controller_status_실행~~~~~~~~~~~~");

        return aiVideoService.checkStatus(taskId);

    }

}