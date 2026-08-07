package com.backend.global.ai;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.extern.log4j.Log4j2;

/**
 * 로컬 Ollama(/api/chat)에 단발성 프롬프트를 보내고 답변 텍스트만 돌려주는 클라이언트.
 * think/history 없이 단순 요청-응답 용도로만 사용한다 (ai/openclaw/README.md 참고).
 */
@Component
@Log4j2
public class OllamaClient {

    @Value("${ollama.base-url}")
    private String baseUrl;

    @Value("${ollama.model}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();

    public String chat(String userMessage) {

        JsonObject message = new JsonObject();
        message.addProperty("role", "user");
        message.addProperty("content", userMessage);

        JsonArray messages = new JsonArray();
        messages.add(message);

        JsonObject body = new JsonObject();
        body.addProperty("model", model);
        body.add("messages", messages);
        body.addProperty("think", false);
        body.addProperty("stream", false);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/api/chat"))
            .header("Content-Type", "application/json")
            .timeout(Duration.ofSeconds(60))
            .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
            .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalStateException("Ollama 응답 오류: HTTP " + response.statusCode());
            }

            JsonObject responseBody = JsonParser.parseString(response.body()).getAsJsonObject();

            return responseBody
                .getAsJsonObject("message")
                .get("content")
                .getAsString();

        } catch (java.io.IOException | InterruptedException e) {
            log.error("Ollama 호출 실패: " + e.getMessage());
            throw new IllegalStateException("Ollama에 연결할 수 없습니다. (" + baseUrl + ")", e);
        }
    }
}
