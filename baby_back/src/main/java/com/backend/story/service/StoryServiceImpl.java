package com.backend.story.service;

import com.backend.story.client.StoryAiClient;
import com.backend.story.dto.StoryAudioDTO;
import com.backend.story.dto.StoryGenerateRequestDTO;
import com.backend.story.dto.StoryGenerateResponseDTO;
import com.backend.story.dto.StoryTtsRequestDTO;
import com.backend.story.dto.StoryTtsStatusDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Log4j2
public class StoryServiceImpl implements StoryService {

    private static final Set<String> THEMES = Set.of(
            "BEDTIME", "ADVENTURE", "FRIENDSHIP", "HABIT", "FAMILY"
    );
    private static final Set<String> LENGTHS = Set.of(
            "SHORT", "MEDIUM", "LONG"
    );

    private final StoryAiClient storyAiClient;

    @Override
    public StoryGenerateResponseDTO generate(
            StoryGenerateRequestDTO requestDTO
    ) {
        validateGenerateRequest(requestDTO);
        log.info(
                "STORY_GENERATE_REQUESTED ageMonths={} interests={} "
                        + "favoriteItems={} theme={} length={}",
                requestDTO.ageMonths(),
                requestDTO.interests().size(),
                requestDTO.favoriteItems().size(),
                requestDTO.theme(),
                requestDTO.length()
        );
        return storyAiClient.generate(requestDTO);
    }

    @Override
    public StoryAudioDTO synthesize(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("STORY_TTS_TEXT_REQUIRED");
        }
        String normalized = text.trim();
        if (normalized.length() > 12000) {
            throw new IllegalArgumentException("STORY_TTS_TEXT_TOO_LONG");
        }
        return storyAiClient.synthesize(
                new StoryTtsRequestDTO(normalized)
        );
    }

    @Override
    public StoryTtsStatusDTO getTtsStatus() {
        return storyAiClient.getTtsStatus();
    }

    private void validateGenerateRequest(
            StoryGenerateRequestDTO requestDTO
    ) {
        if (requestDTO == null) {
            throw new IllegalArgumentException("STORY_REQUEST_REQUIRED");
        }
        if (requestDTO.babyName() == null
                || requestDTO.babyName().isBlank()
                || requestDTO.babyName().trim().length() > 20) {
            throw new IllegalArgumentException("STORY_BABY_NAME_INVALID");
        }
        if (requestDTO.ageMonths() == null
                || requestDTO.ageMonths() < 0
                || requestDTO.ageMonths() > 120) {
            throw new IllegalArgumentException("STORY_AGE_MONTHS_INVALID");
        }
        if (requestDTO.interests().size() > 8
                || requestDTO.favoriteItems().size() > 8) {
            throw new IllegalArgumentException("STORY_PREFERENCE_COUNT_INVALID");
        }
        if (!THEMES.contains(requestDTO.theme())) {
            throw new IllegalArgumentException("STORY_THEME_INVALID");
        }
        if (!LENGTHS.contains(requestDTO.length())) {
            throw new IllegalArgumentException("STORY_LENGTH_INVALID");
        }
    }
}
