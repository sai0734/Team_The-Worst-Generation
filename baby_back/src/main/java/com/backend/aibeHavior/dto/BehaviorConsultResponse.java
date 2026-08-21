package com.backend.aibeHavior.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class BehaviorConsultResponse {

    private Long consultNo;

    private String category;

    private String situation;

    private String aiSummary;

    private List<BehaviorStepDTO> steps;

    private List<BehaviorSourceDTO> sources;

    private String videoId;

    private String videoTitle;

    private List<BehaviorMessageDTO> messages;

    private LocalDateTime regTime;

}