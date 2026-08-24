package com.backend.story.dto;

public record StoryTtsStatusDTO(
        String status,
        String provider,
        String voice,
        boolean modelReady
) {
}
