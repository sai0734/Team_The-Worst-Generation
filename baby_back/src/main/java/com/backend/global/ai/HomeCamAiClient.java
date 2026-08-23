package com.backend.global.ai;

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
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.extern.log4j.Log4j2;

// 홈캠 안전영역 이탈 감지용 이미지 임베딩 서버 (ai/ai-server, homecam 모듈) 호출
@Component
@Log4j2
public class HomeCamAiClient {

    @Value("${homecam.ai-server.base-url}")
    private String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public static class AnalyzeResult {
        public final List<Double> embedding;
        public final Double similarity;
        public final String modelVersion;

        public AnalyzeResult(List<Double> embedding, Double similarity, String modelVersion) {
            this.embedding = embedding;
            this.similarity = similarity;
            this.modelVersion = modelVersion;
        }
    }

    // baselineEmbedding이 null이면 embedding만 채워서 돌아옴 (기준 캡처용)
    // baselineEmbedding이 있으면 similarity도 같이 채워서 돌아옴 (실시간 비교용)
    public AnalyzeResult analyze(String imageBase64, List<Double> baselineEmbedding) {

        JsonObject body = new JsonObject();
        body.addProperty("imageBase64", imageBase64);

        if (baselineEmbedding != null) {
            JsonArray baseline = new JsonArray();
            baselineEmbedding.forEach(baseline::add);
            body.add("baselineEmbedding", baseline);
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/v1/homecam/analyze"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalStateException("홈캠 AI서버 응답 오류: HTTP " + response.statusCode() + " " + response.body());
            }

            JsonObject responseBody = JsonParser.parseString(response.body()).getAsJsonObject();

            List<Double> embedding = new ArrayList<>();
            for (JsonElement e : responseBody.getAsJsonArray("embedding")) {
                embedding.add(e.getAsDouble());
            }

            JsonElement similarityEl = responseBody.get("similarity");
            Double similarity = (similarityEl == null || similarityEl.isJsonNull())
                    ? null
                    : similarityEl.getAsDouble();

            String modelVersion = responseBody.get("modelVersion").getAsString();

            return new AnalyzeResult(embedding, similarity, modelVersion);

        } catch (java.io.IOException | InterruptedException e) {
            log.error("홈캠 AI서버 호출 실패: " + e.getMessage());
            throw new IllegalStateException("홈캠 AI서버에 연결할 수 없습니다. (" + baseUrl + ")", e);
        }
    }
}
