package com.backend.assistant.client;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@Log4j2
public class DataGoKrClient {

    @Value("${data.go.kr.service-key:}")
    private String servicekey;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public JsonObject get(String url, Map<String, String> params) {
        if (servicekey == null || servicekey.isBlank()) {
            throw new IllegalStateException("공공데이터키가 없습니다.");
        }
        try {
            StringBuilder qs = new StringBuilder();
            qs.append("serviceKey=").append(URLEncoder.encode(servicekey, StandardCharsets.UTF_8));
            for (var e : params.entrySet()) {
                if (e.getValue() == null || e.getValue().isBlank()) continue;
                qs.append("&").append(e.getKey()).append("=")
                        .append(URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8));
            }
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url + "?" + qs))
                    .timeout(Duration.ofSeconds(20))
                    .GET()
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                throw new IllegalStateException("data.go.kr HTTP" + res.statusCode());
            }
            return JsonParser.parseString(res.body()).getAsJsonObject();
        } catch (Exception e) {
            log.error("공공데이터 호출 실패: {}", url, e);
            throw new IllegalStateException("공공 API호출 실패", e);
        }
    }

    public List<JsonObject> items(JsonObject root) {
        JsonElement body = root.get("response") != null
                ? root.getAsJsonObject("response").get("body")
                : root.get("body");
        if (body == null || !body.isJsonObject()) return List.of();
        JsonElement items = body.getAsJsonObject().get("items");
        if (items == null) return List.of();
        JsonElement item = items.isJsonObject() ? items.getAsJsonObject().get("item") : items;
        List<JsonObject> out = new ArrayList<>();
        if (item == null) return out;
        if (item.isJsonArray()) {
            JsonArray arr = item.getAsJsonArray();
            for (JsonElement el : arr) out.add(el.getAsJsonObject());
        } else if (item.isJsonObject()) {
            out.add(item.getAsJsonObject());
        }
        return out;
    }

    public static Map<String, String> page(int page, int rows) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("pageNo", String.valueOf(page));
        m.put("numOfRows", String.valueOf(rows));
        m.put("type", "json");
        return m;
    }
}
