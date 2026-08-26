package com.backend.global.ai;

import com.backend.assistant.dto.AssistItemDTO;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
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

    public List<AssistItemDTO> search(int months, String regionSido, Integer householdSize,
                                      List<String> incomeTags) {
        JsonObject body = new JsonObject();
        body.addProperty("babyMonths", months);
        body.addProperty("regionSido", regionSido == null ? "" : regionSido);
        if (householdSize != null) body.addProperty("householdSize", householdSize);
        JsonArray tags = new JsonArray();
        if (incomeTags != null) incomeTags.forEach(tags::add);
        body.add("incomeTags", tags);

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

    private static class SearchResponse {
        List<AssistItemDTO> items;
    }
}