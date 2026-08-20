package com.backend.aibeHavior.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BehaviorSourceDTO {

    private String title;

    private String link;

    private String press;

    private String pubDate;

}