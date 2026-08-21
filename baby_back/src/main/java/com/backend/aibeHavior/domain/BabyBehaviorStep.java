package com.backend.aibeHavior.domain;

import lombok.*;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabyBehaviorStep {

    // PK
    private Long stepNo;

    // FK
    private Long consultNo;

    private int stepOrder;

    private String title;

    private String description;

}