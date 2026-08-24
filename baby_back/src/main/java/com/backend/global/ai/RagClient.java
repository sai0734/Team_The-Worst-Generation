package com.backend.global.ai;

import com.backend.assistant.dto.AssistItemDTO;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

@Component
@Log4j2
public class RagClient {

    private static final String BASE_URL = "http://127.0.0.1:5000/api/v1/subsidy";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    public List<AssistItemDTO> search(int months, String regionSido) {
        JsonObject body = new JsonObject();
        body.addProperty("babyMonths", months);
        body.addProperty("regionSido", regionSido == null ? "" : regionSido);

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/search"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("RAG 서버 HTTP {}", res.statusCode());
                return List.of();
            }
            SearchResponse parsed = new Gson().fromJson(res.body(), SearchResponse.class);
            return parsed.items;
        } catch (Exception e) {
            log.warn("RAG 서버 연결 실패: {}", e.getMessage());
            return List.of();
        }
    }

    public AskResult ask(String question, int months, String regionSido) {
        JsonObject body = new JsonObject();
        body.addProperty("question", question);
        body.addProperty("babyMonths", months);
        body.addProperty("regionSido", regionSido == null ? "" : regionSido);

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/ask"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("RAG 서버 HTTP {}", res.statusCode());
                return new AskResult("지원금 안내를 가져오지 못했습니다.", List.of());
            }
            return new Gson().fromJson(res.body(), AskResult.class);
        } catch (Exception e) {
            log.warn("RAG 서버 연결 실패: {}", e.getMessage());
            return new AskResult("지원금 안내 서버에 연결하지 못했습니다.", List.of());
        }
    }

    public record AskResult(String answer, List<AssistItemDTO> sources) {}

    private static class SearchResponse {
        List<AssistItemDTO> items;
    }
}