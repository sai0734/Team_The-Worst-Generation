package com.backend.story.controller;

import com.backend.story.dto.StoryAudioDTO;
import com.backend.story.dto.StoryGenerateRequestDTO;
import com.backend.story.dto.StoryGenerateResponseDTO;
import com.backend.story.dto.StoryTtsRequestDTO;
import com.backend.story.dto.StoryTtsStatusDTO;
import com.backend.story.exception.StoryAiException;
import com.backend.story.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stories")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class StoryController {

    private final StoryService storyService;

    @PostMapping("/generate")
    public StoryGenerateResponseDTO generate(
            @RequestBody StoryGenerateRequestDTO requestDTO
    ) {
        return storyService.generate(requestDTO);
    }

    @PostMapping("/tts")
    public ResponseEntity<byte[]> synthesize(
            @RequestBody StoryTtsRequestDTO requestDTO
    ) {
        StoryAudioDTO audio = storyService.synthesize(
                requestDTO == null ? null : requestDTO.text()
        );
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(audio.mediaType()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"story.wav\""
                )
                .header("X-TTS-Provider", audio.provider())
                .header("X-TTS-Voice", audio.voice())
                .body(audio.content());
    }

    @GetMapping("/tts/status")
    public StoryTtsStatusDTO getTtsStatus() {
        return storyService.getTtsStatus();
    }

    @ExceptionHandler(StoryAiException.class)
    public ResponseEntity<Map<String, String>> handleStoryAiException(
            StoryAiException error
    ) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", error.getMessage()));
    }
}
