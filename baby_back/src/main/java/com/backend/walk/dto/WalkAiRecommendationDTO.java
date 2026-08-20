package com.backend.walk.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WalkAiRecommendationDTO {
    private String answer;
    private List<WalkPlaceDTO> places;
    private String temperature;
    private String precipitationType;
    private String humidity;
}