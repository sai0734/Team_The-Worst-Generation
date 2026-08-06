package com.backend.allergy.client;


import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class GeminiApiClient {

    @Value("${google.gemini.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateRecipe(String prompt) {

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
                + apiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        Map<String, Object> response = restTemplate.postForObject(url, requestEntity, Map.class);

        return parseTextFromResponse(response);
    }

    @SuppressWarnings("unchecked")
    private String parseTextFromResponse(Map<String, Object> response) {

        if (response == null) {
            return "";
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");

        if (candidates == null || candidates.isEmpty()) {
            return "";
        }

        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");

        return (String) parts.get(0).get("text");
    }
}