package com.backend.aibeHavior.dto;

import lombok.Data;

@Data
public class BehaviorConsultRequest {

    private Long babyNo;

    private String category;

    private String situation;

}