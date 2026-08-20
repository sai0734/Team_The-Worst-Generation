package com.backend.openclaw.message.client;

import com.backend.openclaw.common.exception.OpenClawGatewayException;
import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Log4j2
public class OpenClawMessageClient {

    private static final String AGENT_ID = "message-dispatcher";
    private static final String MODEL = "openclaw/message-dispatcher";
    private static final String SYSTEM_PROMPT = """
            너는 메시지 미션 실행 전용 에이전트다.
            사용자 메시지는 MessageMission JSON이다.
            android_sms_send 도구의 인자는 반드시 {"mission": 사용자 메시지로 받은 JSON} 형식으로 구성한다.
            android_sms_send 도구를 정확히 한 번 호출하며 다른 도구는 호출하지 않는다.
            missionId, source, dryRun, requestedBy, requestedAt, to, content 값을 변경하거나 새로 만들지 않는다.
            도구 실행이 끝나면 도구가 반환한 JSON만 출력하고 설명, 마크다운, 코드 블록을 추가하지 않는다.
            """;

    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${openclaw.base-url:http://127.0.0.1:18789}")
    private String baseUrl;

    @Value("${openclaw.gateway-token:}")
    private String gatewayToken;

    public JsonNode dispatchMission(MessageMissionDTO mission) {
        validateRequest(mission);

        try {
            String missionJson = objectMapper.writeValueAsString(mission);

            Map<String, Object> systemMessage = Map.of(
                    "role", "system",
                    "content", SYSTEM_PROMPT
            );
            Map<String, Object> userMessage = Map.of(
                    "role", "user",
                    "content", missionJson
            );

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", MODEL);
            requestBody.put("messages", List.of(systemMessage, userMessage));
            requestBody.put("temperature", 0);
            requestBody.put("stream", false);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalizedBaseUrl() + "/v1/chat/completions"))
                    .header("Authorization", "Bearer " + gatewayToken.trim())
                    .header("Content-Type", "application/json")
                    .header("x-openclaw-agent-id", AGENT_ID)
                    .header(
                            "x-openclaw-session-key",
                            "agent:"
                                    + AGENT_ID
                                    + ":message-mission-"
                                    + mission.getMetadata().getMissionId()
                    )
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(
                            objectMapper.writeValueAsString(requestBody)
                    ))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() != 200) {
                throw new OpenClawGatewayException(
                        resolveHttpError(response.statusCode(), response.body())
                );
            }

            return extractAgentResult(response.body());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new OpenClawGatewayException(
                    "OPENCLAW_REQUEST_INTERRUPTED",
                    e
            );
        } catch (IOException e) {
            throw new OpenClawGatewayException(
                    "OPENCLAW_CONNECTION_FAILED",
                    e
            );
        }
    }

    private void validateRequest(MessageMissionDTO mission) {
        if (mission == null
                || mission.getMetadata() == null
                || mission.getMetadata().getMissionId() == null
                || mission.getMetadata().getMissionId().isBlank()) {
            throw new OpenClawGatewayException(
                    "OPENCLAW_MESSAGE_MISSION_REQUIRED"
            );
        }

        if (gatewayToken == null || gatewayToken.isBlank()) {
            throw new OpenClawGatewayException(
                    "OPENCLAW_GATEWAY_TOKEN_REQUIRED"
            );
        }

        if (baseUrl == null || baseUrl.isBlank()) {
            throw new OpenClawGatewayException(
                    "OPENCLAW_BASE_URL_REQUIRED"
            );
        }
    }

    private JsonNode extractAgentResult(String responseBody)
            throws IOException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode choices = root.path("choices");

        if (!choices.isArray() || choices.isEmpty()) {
            throw new OpenClawGatewayException(
                    "OPENCLAW_AGENT_RESPONSE_REQUIRED"
            );
        }

        String content = choices.get(0)
                .path("message")
                .path("content")
                .asText("")
                .trim();

        if (content.isBlank()) {
            throw new OpenClawGatewayException(
                    "OPENCLAW_AGENT_RESPONSE_REQUIRED"
            );
        }

        try {
            return objectMapper.readTree(content);
        } catch (IOException e) {
            throw new OpenClawGatewayException(
                    "OPENCLAW_AGENT_RESPONSE_INVALID",
                    e
            );
        }
    }

    private String resolveHttpError(int statusCode, String responseBody) {
        try {
            String message = objectMapper.readTree(responseBody)
                    .path("error")
                    .path("message")
                    .asText("");

            if (!message.isBlank()) {
                return "OPENCLAW_HTTP_" + statusCode + ": " + message;
            }
        } catch (Exception ignored) {
            log.debug("OpenClaw 오류 응답이 JSON 형식이 아님");
        }

        return "OPENCLAW_HTTP_" + statusCode;
    }

    private String normalizedBaseUrl() {
        String trimmed = baseUrl.trim();

        return trimmed.endsWith("/")
                ? trimmed.substring(0, trimmed.length() - 1)
                : trimmed;
    }
}