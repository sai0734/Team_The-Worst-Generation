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
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Component
@Log4j2
public class OpenClawClient {

    @Value("${openclaw.base-url:http://127.0.0.1:18789}")
    private String baseUrl;

    @Value("${openclaw.gateway-token:}")
    private String gatewayToken;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /** 실패하면 null. OpenClaw가 [] 를 주면 빈 목록. 공공 API 원본은 호출 쪽에서 쓰지 않는다. */
    public List<AssistItemDTO> pick(int months, String region, String babyName, String gender,
                                   List<AssistItemDTO> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }

        String message = buildPrompt(months, region, babyName, gender, candidates);

        JsonObject user = new JsonObject();
        user.addProperty("role", "user");
        user.addProperty("content", message);
        JsonArray messages = new JsonArray();
        messages.add(user);

        JsonObject body = new JsonObject();
        body.addProperty("model", "openclaw/default");
        body.add("messages", messages);

        try {
            String root = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
            String token = resolveToken();
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(root + "/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(25))
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()));
            if (!token.isBlank()) {
                builder.header("Authorization", "Bearer " + token);
            }
            HttpResponse<String> res = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("OpenClaw HTTP {} body={}", res.statusCode(), res.body());
                return null;
            }
            return parseItems(res.body());
        } catch (Exception e) {
            log.warn("OpenClaw 연결 실패: {}", e.getMessage());
            return null;
        }
    }

    static String buildPrompt(int months, String region, String babyName, String gender,
                              List<AssistItemDTO> candidates) {
        String safeRegion = (region == null || region.isBlank()) ? "미입력" : region.trim();
        String safeName = (babyName == null || babyName.isBlank()) ? "미입력" : babyName.trim();
        String safeGender = (gender == null || gender.isBlank()) ? "미입력" : gender.trim();
        String candidatesJson = new Gson().toJson(candidates);

        return """
                너는 육아 지원 목록을 거르는 필터다. 상담사처럼 설명하지 마라.

                [프로필]
                - 아이 이름: %s
                - 아이 월령: %d
                - 성별: %s
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
                """.formatted(safeName, months, safeGender, safeRegion)
                + candidatesJson;
    }

    private String resolveToken() {
        if (gatewayToken != null && !gatewayToken.isBlank()) {
            return gatewayToken.trim();
        }
        try {
            Path file = Path.of(System.getProperty("user.home"), ".openclaw", "openclaw.json");
            if (!Files.isRegularFile(file)) {
                return "";
            }
            JsonObject root = JsonParser.parseString(Files.readString(file)).getAsJsonObject();
            if (!root.has("gateway") || !root.get("gateway").isJsonObject()) {
                return "";
            }
            JsonObject auth = root.getAsJsonObject("gateway").getAsJsonObject("auth");
            if (auth == null || !auth.has("token") || auth.get("token").isJsonNull()) {
                return "";
            }
            return auth.get("token").getAsString().trim();
        } catch (Exception e) {
            log.warn("OpenClaw 토큰 파일을 읽지 못함");
            return "";
        }
    }

    private List<AssistItemDTO> parseItems(String raw) {
        try {
            String content = extractAssistantText(raw);
            String json = extractJsonArray(content);
            if (json == null) {
                log.warn("OpenClaw 응답에 JSON 배열이 없음");
                return null;
            }
            JsonArray arr = JsonParser.parseString(json).getAsJsonArray();
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
            return out;
        } catch (Exception e) {
            log.warn("OpenClaw 응답 파싱 실패", e);
            return null;
        }
    }

    private static String extractAssistantText(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        try {
            JsonElement el = JsonParser.parseString(raw);
            if (!el.isJsonObject()) {
                return raw;
            }
            JsonObject o = el.getAsJsonObject();
            if (o.has("choices") && o.get("choices").isJsonArray()) {
                JsonArray choices = o.getAsJsonArray("choices");
                if (!choices.isEmpty() && choices.get(0).isJsonObject()) {
                    JsonObject c0 = choices.get(0).getAsJsonObject();
                    if (c0.has("message") && c0.get("message").isJsonObject()) {
                        String content = str(c0.getAsJsonObject("message"), "content");
                        if (!content.isBlank()) {
                            return content;
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // 봉투가 JSON이 아니면 본문 전체를 모델 답으로 본다
        }
        return raw;
    }

    private static String extractJsonArray(String content) {
        if (content == null) {
            return null;
        }
        int start = content.indexOf('[');
        int end = content.lastIndexOf(']');
        if (start < 0 || end <= start) {
            return null;
        }
        return content.substring(start, end + 1);
    }

    private static String normalizeStatus(String status) {
        return "DONE".equalsIgnoreCase(status) ? "DONE" : "APPLY";
    }

    private static String str(JsonObject o, String key) {
        return o.has(key) && !o.get(key).isJsonNull() ? o.get(key).getAsString() : "";
    }
}
