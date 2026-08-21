package com.backend.aibeHavior.client;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Component
@Log4j2
public class NaverNewsClient {

    private static final String URL = "https://naverapihub.apigw.ntruss.com/search/v1/news";

    @Value("${naver.client-id:}")
    private String clientId;

    @Value("${naver.client-secret:}")
    private String clientSecret;


    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public List<JsonObject> search(String query, int display) {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalArgumentException("네이버 API 키가 없습니다. NAVER_CLIENT_ID/NAVER_CLIENT_SECRET을 확인하세요.");
        }

        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(URL + "?query=" + encodedQuery + "&display=" + display))
                    .header("X-NCP-APIGW-API-KEY-ID", clientId)
                    .header("X-NCP-APIGW-API-KEY", clientSecret)
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalArgumentException("네이버 뉴스 API 오류: HTTP " + response.statusCode());
            }
            
            JsonObject root = JsonParser.parseString(response.body()).getAsJsonObject();
            JsonArray items = root.getAsJsonArray("items");

            List<JsonObject> list = new ArrayList<>();
            if (items != null) {
                for (JsonElement el : items) {
                    list.add(el.getAsJsonObject());
                }
            }
            return  list;
        } catch (IOException | InterruptedException e) {
            log.error("네이버 뉴스 API 호출 실패", e);
            throw new IllegalArgumentException("네이버 뉴스 API 호출에 실패했스빈다.", e);
        }
    }
}
