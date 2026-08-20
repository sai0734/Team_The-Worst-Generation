package com.backend.aibeHavior.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BehaviorStepDTO {

    private int stepOrder;

    private String title;

    private String description;

}