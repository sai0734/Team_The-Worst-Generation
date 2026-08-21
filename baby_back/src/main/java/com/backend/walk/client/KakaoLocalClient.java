package com.backend.walk.client;

import com.google.gson.JsonArray;
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
public class KakaoLocalClient {

    private static final String KEYWORD_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
    private static final String PARK_KEYWORD = "공원";

    @Value("${kakao.rest-api-key:}")
    private String restApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // 내 위치 기준 반경(radiusM) 안의 공원을 거리순으로 조회
    public List<KakaoPlace> searchNearbyParks(double lat, double lng, int radiusM) {
        if (restApiKey == null || restApiKey.isBlank()) {
            throw new IllegalStateException("KAKAO_REST_API_KEY is empty.");
        }

        String url = KEYWORD_SEARCH_URL
                + "?query=" + URLEncoder.encode(PARK_KEYWORD, StandardCharsets.UTF_8)
                + "&x=" + lng
                + "&y=" + lat
                + "&radius=" + radiusM
                + "&sort=distance";

        return parseDocuments(call(url));
    }

    private String call(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "KakaoAK " + restApiKey)
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalStateException("Kakao Local API HTTP error: " + response.statusCode());
            }
            return response.body();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Kakao Local API call interrupted.", e);
        } catch (IOException e) {
            log.error("Kakao Local API call failed: {}", e.getMessage());
            throw new IllegalStateException("Kakao Local API call failed.", e);
        }
    }

    private List<KakaoPlace> parseDocuments(String json) {
        JsonArray documents = JsonParser.parseString(json).getAsJsonObject().getAsJsonArray("documents");

        List<KakaoPlace> places = new ArrayList<>();
        for (int i = 0; i < documents.size(); i++) {
            JsonObject doc = documents.get(i).getAsJsonObject();
            String roadAddress = doc.get("road_address_name").getAsString();
            String address = roadAddress.isBlank()
                    ? doc.get("address_name").getAsString()
                    :roadAddress;
            places.add(new KakaoPlace(
                    doc.get("place_name").getAsString(),
                    address,
                    doc.get("y").getAsDouble(),
                    doc.get("x").getAsDouble(),
                    doc.get("distance").getAsDouble(),
                    doc.get("category_name").getAsString()
            ));
        }
        return places;
    }
}