package com.backend.assistant.dto;

import lombok.Data;

import java.util.List;

@Data

public class AssistRecommendRequest {

    private String query;
    private List<String> categories;
    private ChildContext child;

    @Data
    public static class ChildContext {
        private Integer babyMonths;
        private String regionSido;
        private String regionSigungu;
    }
}
