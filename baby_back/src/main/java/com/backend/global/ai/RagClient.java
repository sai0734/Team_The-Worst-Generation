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
    private static final Duration REINDEX_TIMEOUT = Duration.ofMinutes(20);

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    public AskResult ask(
            String question,
            int months,
            String regionSido,
            String regionSigungu,
            Integer householdSize,
            String medianIncomeBand,
            List<String> householdTypes
    ) {
        JsonObject body = new JsonObject();
        body.addProperty("question", question == null ? "" : question);
        body.addProperty("babyMonths", months);
        body.addProperty("regionSido", regionSido == null ? "" : regionSido);
        body.addProperty("regionSigungu", regionSigungu == null ? "" : regionSigungu);
        if (householdSize != null) body.addProperty("householdSize", householdSize);
        body.addProperty(
                "medianIncomeBand",
                medianIncomeBand == null || medianIncomeBand.isBlank() ? "UNKNOWN" : medianIncomeBand
        );
        JsonArray types = new JsonArray();
        if (householdTypes != null) householdTypes.forEach(types::add);
        body.add("householdTypes", types);

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/ask"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(90))
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

    public ReindexResult reindex() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/reindex"))
                    .header("Content-Type", "application/json")
                    .timeout(REINDEX_TIMEOUT)
                    .POST(HttpRequest.BodyPublishers.ofString("{}"))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("RAG 재색인 서버 HTTP {}", res.statusCode());
                return ReindexResult.failed("RAG 재색인 서버 HTTP " + res.statusCode());
            }

            ReindexResult result = new Gson().fromJson(res.body(), ReindexResult.class);
            if (result == null) {
                return ReindexResult.failed("RAG 재색인 응답이 비어 있습니다.");
            }
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("RAG 재색인 요청이 중단됨: {}", e.getMessage());
            return ReindexResult.failed("RAG 재색인 요청이 중단됐습니다.");
        } catch (Exception e) {
            log.warn("RAG 재색인 서버 연결 실패: {}", e.getMessage());
            return ReindexResult.failed("RAG 재색인 서버에 연결하지 못했습니다.");
        }
    }

    public record AskResult(String answer, List<AssistItemDTO> sources) {}

    public record ReindexResult(
            boolean success,
            boolean running,
            String message,
            int totalCount,
            int insertedCount,
            int updatedCount,
            int unchangedCount,
            int deletedCount,
            String startedAt,
            String completedAt
    ) {
        static ReindexResult failed(String message) {
            return new ReindexResult(
                    false, false, message,
                    0, 0, 0, 0, 0,
                    null, null
            );
        }
    }
}
