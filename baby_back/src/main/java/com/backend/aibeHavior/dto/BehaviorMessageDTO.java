package com.backend.aibeHavior.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BehaviorMessageDTO {

    private String role;

    private String content;

}