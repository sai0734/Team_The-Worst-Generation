package com.backend.global.ai;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.extern.log4j.Log4j2;

@Component
@Log4j2
public class RecallMatchAiClient {

    @Value("${recallai.base-url}")
    private String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public record Candidate(String recallId, String title, String brandName) {}

    public record MatchResult(String recallId, double score) {}

    public record MatchResponse(List<MatchResult> matches, String modelStatus) {}

    public MatchResponse match(String itemName, String brandName, String modelName, List<Candidate> candidates) {

        JsonArray candidatesJson = new JsonArray();
        for (Candidate candidate : candidates) {
            JsonObject candidateJson = new JsonObject();
            candidateJson.addProperty("recallId", candidate.recallId());
            candidateJson.addProperty("title", candidate.title());
            if (candidate.brandName() != null) {
                candidateJson.addProperty("brandName", candidate.brandName());
            }
            candidatesJson.add(candidateJson);
        }

        JsonObject body = new JsonObject();
        body.addProperty("itemName", itemName);
        if (brandName != null) {
            body.addProperty("brandName", brandName);
        }
        if (modelName != null) {
            body.addProperty("modelName", modelName);
        }
        body.add("candidates", candidatesJson);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/v1/recall/match"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

        JsonObject data = send(request);

        List<MatchResult> matches = new ArrayList<>();
        for (var element : data.getAsJsonArray("matches")) {
            JsonObject matchJson = element.getAsJsonObject();
            matches.add(new MatchResult(
                    matchJson.get("recallId").getAsString(),
                    matchJson.get("score").getAsDouble()
            ));
        }

        return new MatchResponse(matches, data.get("modelStatus").getAsString());
    }

    private JsonObject send(HttpRequest request) {

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalStateException("리콜 매칭 서버 응답 오류: HTTP " + response.statusCode());
            }

            return JsonParser.parseString(response.body()).getAsJsonObject();

        } catch (IOException | InterruptedException e) {
            log.error("리콜 매칭 서버 호출 실패: " + e.getMessage());
            throw new IllegalStateException("리콜 매칭 서버에 연결할 수 없습니다. (" + baseUrl + ")", e);
        }
    }
}
