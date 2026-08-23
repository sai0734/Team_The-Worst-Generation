package com.backend.story.dto;

public record StoryGenerateResponseDTO(
        String storyId,
        String title,
        String content,
        String generationMode,
        int characterCount,
        int sceneCount
) {
}
