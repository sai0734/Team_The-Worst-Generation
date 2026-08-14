package com.backend.global.ai;

import com.backend.assistant.dto.AssistItemDTO;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Component
@Log4j2
public class OpenClawClient {

    @Value("${openclaw.base-url:http://127.0.0.1:18789}")
    private String baseUrl;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final Gson gson = new Gson();

    /** 실패하거나 파싱이 안 되면 null → 호출 쪽에서 공공 API 원본을 사용 */
    public List<AssistItemDTO> pick(int months, String region, List<AssistItemDTO> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }

        String message = buildPrompt(months, region, candidates);

        JsonObject body = new JsonObject();
        body.addProperty("agent", "main");
        body.addProperty("message", message);

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/v1/chat"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("OpenClaw HTTP {}", res.statusCode());
                return null;
            }
            return parseItems(res.body());
        } catch (Exception e) {
            log.warn("OpenClaw 연결 실패, 공공 API 목록을 그대로 사용: {}", e.getMessage());
            return null;
        }
    }

    static String buildPrompt(int months, String region, List<AssistItemDTO> candidates) {
        String safeRegion = (region == null || region.isBlank()) ? "미입력" : region.trim();
        String candidatesJson = new Gson().toJson(candidates);

        return """
                너는 육아 지원 목록을 거르는 필터다. 상담사처럼 설명하지 마라.

                [프로필]
                - 아이 월령: %d
                - 거주지: %s

                [할 일]
                CANDIDATES 배열에서 이 프로필과 맞을 가능성이 있는 항목만 남긴다.

                [금지]
                - CANDIDATES에 없는 id/title/link를 만들지 마라.
                - 마크다운, 코드펜스, 주석, 앞뒤 설명을 쓰지 마라.
                - JSON 배열 이외의 문자를 출력하지 마라.

                [유지 규칙]
                - id, title, link, category, source 는 원본 값을 그대로 복사한다.
                - summary 는 원본을 유지하거나 한 줄로만 줄인다.
                - status 는 APPLY 또는 DONE 만 사용한다. 원본이 DONE 이면 DONE, 그 외는 APPLY.
                - 월령/거주지와 명백히 무관한 항목만 뺀다. 애매하면 남긴다.
                - 남을 항목이 없으면 [] 만 출력한다.

                [출력]
                [{"id":"","title":"","summary":"","status":"APPLY","link":"","category":"","source":""}]

                [CANDIDATES]
                """.formatted(months, safeRegion)
                + candidatesJson;
    }

    private List<AssistItemDTO> parseItems(String raw) {
        try {
            int start = raw.indexOf('[');
            int end = raw.lastIndexOf(']');
            if (start < 0 || end <= start) {
                return null;
            }
            JsonArray arr = JsonParser.parseString(raw.substring(start, end + 1)).getAsJsonArray();
            List<AssistItemDTO> out = new ArrayList<>();
            for (JsonElement el : arr) {
                if (!el.isJsonObject()) {
                    continue;
                }
                JsonObject o = el.getAsJsonObject();
                String title = str(o, "title");
                if (title.isBlank()) {
                    continue;
                }
                out.add(AssistItemDTO.builder()
                        .id(str(o, "id"))
                        .title(title)
                        .summary(str(o, "summary"))
                        .status(normalizeStatus(str(o, "status")))
                        .link(str(o, "link"))
                        .category(str(o, "category"))
                        .source(str(o, "source"))
                        .build());
            }
            return out.isEmpty() ? null : out;
        } catch (Exception e) {
            log.warn("OpenClaw 응답 파싱 실패", e);
            return null;
        }
    }

    private static String normalizeStatus(String status) {
        return "DONE".equalsIgnoreCase(status) ? "DONE" : "APPLY";
    }

    private static String str(JsonObject o, String key) {
        return o.has(key) && !o.get(key).isJsonNull() ? o.get(key).getAsString() : "";
    }
}
