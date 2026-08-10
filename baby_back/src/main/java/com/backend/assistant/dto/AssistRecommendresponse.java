package com.backend.assistant.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder

public class AssistRecommendresponse {
    private String answer;
    private List<AssistItemDTO> items;
}
