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

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.extern.log4j.Log4j2;

@Component
@Log4j2
public class VideoGenerationClient {

    @Value("${videoai.base-url}")
    private String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public record VideoResult(String fileName, double durationSeconds) {}

    public VideoResult generate(byte[] imageBytes, String narrationText) {

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        JsonObject body = new JsonObject();
        body.addProperty("imageBase64", base64Image);
        body.addProperty("narrationText", narrationText);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/v1/video/generate"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(180))
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

        JsonObject data = send(request);

        return new VideoResult(
                data.get("fileName").getAsString(),
                data.get("durationSeconds").getAsDouble()
        );
    }

    private JsonObject send(HttpRequest request) {

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalStateException("동영상 생성 서버 응답 오류: HTTP " + response.statusCode());
            }

            return JsonParser.parseString(response.body()).getAsJsonObject();

        } catch (IOException | InterruptedException e) {
            log.error("동영상 생성 서버 호출 실패: " + e.getMessage());
            throw new IllegalStateException("동영상 생성 서버에 연결할 수 없습니다. (" + baseUrl + ")", e);
        }
    }
}