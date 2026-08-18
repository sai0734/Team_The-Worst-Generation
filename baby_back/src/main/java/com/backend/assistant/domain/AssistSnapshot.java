package com.backend.assistant.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistSnapshot {
    private Long snapshotNo;
    private String email;
    private Long babyNo;
    private String itemId;
    private String category;
    private String title;
    private String summary;
    private String link;
    private String status;
    private String source;
}
