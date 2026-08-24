package com.backend.health.ai;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.extern.log4j.Log4j2;

@Component
@Log4j2
public class PythonVisionClient {

    @Value("${python.vision.base-url}")
    private String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public String chatWithImage(String prompt, byte[] imageBytes) {

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        JsonObject body = new JsonObject();
        body.addProperty("prompt", prompt);
        body.addProperty("imageBase64", base64Image);

        byte[] bodyBytes = body.toString().getBytes(StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/v1/health/vision-check"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(120))
                .POST(HttpRequest.BodyPublishers.ofByteArray(bodyBytes))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Vision 서비스 응답 본문: " + response.body());
                throw new IllegalStateException(
                        "Vision 서비스 응답 오류: HTTP " + response.statusCode() + " - " + response.body());
            }

            JsonObject responseBody = JsonParser.parseString(response.body()).getAsJsonObject();
            return responseBody.get("result").getAsString();

        } catch (java.io.IOException | InterruptedException e) {
            log.error("Python vision 서비스 호출 실패: " + e.getMessage());
            throw new IllegalStateException("Vision 서비스에 연결할 수 없습니다. (" + baseUrl + ")", e);
        }
    }
}