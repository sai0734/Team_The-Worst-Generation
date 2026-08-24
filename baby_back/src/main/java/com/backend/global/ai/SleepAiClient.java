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
public class SleepAiClient {

    @Value("${sleepai.base-url}")
    private String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public record DailyTotal(String date, int napMinutes, int nightMinutes, boolean hasRecord) {}

    public record AnalysisResult(
            double trendMinutesPerDay,
            double guidelineMinHours,
            double guidelineMaxHours,
            double averageTotalHours,
            List<String> anomalyDates,
            String modelStatus
    ) {}

    public AnalysisResult analyze(int ageInMonths, List<DailyTotal> dailyTotals) {

        JsonArray dailyTotalsJson = new JsonArray();
        for (DailyTotal daily : dailyTotals) {
            JsonObject dailyJson = new JsonObject();
            dailyJson.addProperty("date", daily.date());
            dailyJson.addProperty("napMinutes", daily.napMinutes());
            dailyJson.addProperty("nightMinutes", daily.nightMinutes());
            dailyJson.addProperty("hasRecord", daily.hasRecord());
            dailyTotalsJson.add(dailyJson);
        }

        JsonObject body = new JsonObject();
        body.addProperty("ageInMonths", ageInMonths);
        body.add("dailyTotals", dailyTotalsJson);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/v1/sleep/analyze"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

        JsonObject data = send(request);

        List<String> anomalyDates = new ArrayList<>();
        for (var element : data.getAsJsonArray("anomalyDates")) {
            anomalyDates.add(element.getAsString());
        }

        return new AnalysisResult(
                data.get("trendMinutesPerDay").getAsDouble(),
                data.get("guidelineMinHours").getAsDouble(),
                data.get("guidelineMaxHours").getAsDouble(),
                data.get("averageTotalHours").getAsDouble(),
                anomalyDates,
                data.get("modelStatus").getAsString()
        );
    }

    private JsonObject send(HttpRequest request) {

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalStateException("수면 분석 서버 응답 오류: HTTP " + response.statusCode());
            }

            return JsonParser.parseString(response.body()).getAsJsonObject();

        } catch (IOException | InterruptedException e) {
            log.error("수면 분석 서버 호출 실패: " + e.getMessage());
            throw new IllegalStateException("수면 분석 서버에 연결할 수 없습니다. (" + baseUrl + ")", e);
        }
    }
}