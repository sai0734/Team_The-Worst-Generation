package com.backend.aivideo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AiVideoFallbackResultDTO {

    private String fileName;

    private double durationSeconds;

}