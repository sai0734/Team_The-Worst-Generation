package com.backend.allergy.client;


import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class VisionApiClient {

    @Value("${google.vision.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String extractText(byte[] imageBytes) {

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        String url = "https://vision.googleapis.com/v1/images:annotate?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
                "requests", List.of(
                        Map.of(
                                "image", Map.of("content", base64Image),
                                "features", List.of(Map.of("type", "TEXT_DETECTION"))
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

        List<Map<String, Object>> responses = (List<Map<String, Object>>) response.get("responses");

        if (responses == null || responses.isEmpty()) {
            return "";
        }

        List<Map<String, Object>> textAnnotations =
                (List<Map<String, Object>>) responses.get(0).get("textAnnotations");

        if (textAnnotations == null || textAnnotations.isEmpty()) {
            return "";
        }

        return (String) textAnnotations.get(0).get("description");
    }
}