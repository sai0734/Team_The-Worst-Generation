package com.backend.assistant.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder

public class AssistItemDTO {
    private String id;
    private String category;
    private String title;
    private String summary;
    private String source;
    private String link;

}
