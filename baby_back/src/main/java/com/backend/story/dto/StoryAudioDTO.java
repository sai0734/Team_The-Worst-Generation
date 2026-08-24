package com.backend.story.dto;

public record StoryAudioDTO(
        byte[] content,
        String mediaType,
        String provider,
        String voice
) {
}
