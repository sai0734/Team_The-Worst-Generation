package com.backend.story.dto;

import java.util.List;

public record StoryGenerateRequestDTO(
        String babyName,
        Integer ageMonths,
        List<String> interests,
        List<String> favoriteItems,
        String theme
) {
    public StoryGenerateRequestDTO {
        interests = interests == null ? List.of() : List.copyOf(interests);
        favoriteItems = favoriteItems == null ? List.of() : List.copyOf(favoriteItems);
        theme = theme == null || theme.isBlank() ? "BEDTIME" : theme.trim();
    }
}
