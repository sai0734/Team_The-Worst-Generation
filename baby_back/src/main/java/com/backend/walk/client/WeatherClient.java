package com.backend.walk.client;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Component
@Log4j2
public class WeatherClient {

    @Value("${weather.api.base-url}")
    private String baseUrl;

    @Value("${weather.api.service-key}")
    private String serviceKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // category: T1H(기온), RN1(1시간강수량), REH(습도), PTY(강수형태코드) 등
    public Map<String, String> getCurrentWeather(double lat, double lon) {
        if (serviceKey == null || serviceKey.isBlank()) {
            throw new IllegalStateException("WEATHER_API_SERVICE_KEY is empty.");
        }

        WeatherGrid grid = WeatherGrid.fromLatLon(lat, lon);
        LocalDateTime baseDateTime = latestBaseDateTime();

        String url = baseUrl + "/getUltraSrtNcst"
                + "?serviceKey=" + serviceKey // 공공데이터포털 발급키는 이미 URL 인코딩되어 있어 재인코딩하지 않는다
                + "&pageNo=1"
                + "&numOfRows=10"
                + "&dataType=JSON"
                + "&base_date=" + baseDateTime.format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "&base_time=" + baseDateTime.format(DateTimeFormatter.ofPattern("HHmm"))
                + "&nx=" + grid.nx()
                + "&ny=" + grid.ny();

        return parseItems(call(url));
    }

    private String call(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalStateException("Weather API HTTP error: " + response.statusCode());
            }
            return response.body();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Weather API call interrupted.", e);
        } catch (IOException e) {
            log.error("Weather API call failed: {}", e.getMessage());
            throw new IllegalStateException("Weather API call failed.", e);
        }
    }

    private Map<String, String> parseItems(String json) {
        JsonObject response = JsonParser.parseString(json).getAsJsonObject().getAsJsonObject("response");

        String resultCode = response.getAsJsonObject("header").get("resultCode").getAsString();
        if (!"00".equals(resultCode)) {
            String resultMsg = response.getAsJsonObject("header").get("resultMsg").getAsString();
            throw new IllegalStateException("Weather API error: " + resultCode + " / " + resultMsg);
        }

        JsonArray items = response.getAsJsonObject("body")
                .getAsJsonObject("items")
                .getAsJsonArray("item");

        Map<String, String> result = new HashMap<>();
        for (int i = 0; i < items.size(); i++) {
            JsonObject item = items.get(i).getAsJsonObject();
            result.put(item.get("category").getAsString(), item.get("obsrValue").getAsString());
        }
        return result;
    }

    // 초단기실황은 매시 40분 생성, 지연 감안해 45분 이전이면 직전 정시 자료를 요청
    private LocalDateTime latestBaseDateTime() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime base = now.getMinute() < 45 ? now.minusHours(1) : now;
        return base.withMinute(0).withSecond(0).withNano(0);
    }
}