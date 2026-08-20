package com.backend.global.ai;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.extern.log4j.Log4j2;

@Component
@Log4j2
public class KlingClient {

    @Value("${kling.api-key}")
    private String apiKey;

    @Value("${kling.base-url}")
    private String baseUrl;

    @Value("${kling.model-name}")
    private String modelName;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public record TaskStatus(String status, String videoUrl) {}

    public String submitImageToVideo(String prompt, byte[] imageBytes) {

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        JsonObject body = new JsonObject();
        body.addProperty("model_name", modelName);
        body.addProperty("image", base64Image);
        body.addProperty("prompt", prompt);
        body.addProperty("duration", "5");
        body.addProperty("mode", "std");

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/v1/videos/image2video"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

        JsonObject data = send(request);

        return data.get("task_id").getAsString();
    }

    public TaskStatus checkStatus(String taskId) {

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/v1/videos/image2video/" + taskId))
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

        JsonObject data = send(request);

        String status = data.get("task_status").getAsString();

        String videoUrl = null;
        if ("succeed".equals(status)) {
            JsonArray videos = data.getAsJsonObject("task_result").getAsJsonArray("videos");
            videoUrl = videos.get(0).getAsJsonObject().get("url").getAsString();
        }

        return new TaskStatus(status, videoUrl);
    }

    private JsonObject send(HttpRequest request) {

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalStateException("Kling 응답 오류: HTTP " + response.statusCode());
            }

            JsonObject responseBody = JsonParser.parseString(response.body()).getAsJsonObject();

            return responseBody.getAsJsonObject("data");

        } catch (IOException | InterruptedException e) {
            log.error("Kling 호출 실패: " + e.getMessage());
            throw new IllegalStateException("Kling에 연결할 수 없습니다. (" + baseUrl + ")", e);
        }
    }
}