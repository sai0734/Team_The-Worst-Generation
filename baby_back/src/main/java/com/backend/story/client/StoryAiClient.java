package com.backend.story.client;

import com.backend.story.dto.StoryAudioDTO;
import com.backend.story.dto.StoryGenerateRequestDTO;
import com.backend.story.dto.StoryGenerateResponseDTO;
import com.backend.story.dto.StoryTtsRequestDTO;
import com.backend.story.dto.StoryTtsStatusDTO;
import com.backend.story.exception.StoryAiException;
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
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
@RequiredArgsConstructor
@Log4j2
public class StoryAiClient {

    private static final Duration GENERATION_TIMEOUT = Duration.ofSeconds(180);
    private static final Duration TTS_TIMEOUT = Duration.ofSeconds(180);

    private final ObjectMapper objectMapper;

    @Value("${ai-server.base-url:http://127.0.0.1:5000}")
    private String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    public StoryGenerateResponseDTO generate(StoryGenerateRequestDTO requestDTO) {
        HttpRequest request = jsonRequest(
                "/api/v1/stories/generate",
                requestDTO,
                GENERATION_TIMEOUT
        );
        long startedAt = System.nanoTime();
        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );
            requireSuccess(response.statusCode(), response.body());
            StoryGenerateResponseDTO result = objectMapper.readValue(
                    response.body(),
                    StoryGenerateResponseDTO.class
            );
            log.info(
                    "STORY_AI_GENERATE_SUCCEEDED status={} elapsedMs={} "
                            + "storyId={} chars={} scenes={}",
                    response.statusCode(),
                    elapsedMillis(startedAt),
                    result.storyId(),
                    result.characterCount(),
                    result.sceneCount()
            );
            return result;
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw connectionError("STORY_AI_GENERATE_INTERRUPTED", error, startedAt);
        } catch (IOException error) {
            throw connectionError("STORY_AI_GENERATE_CONNECTION_FAILED", error, startedAt);
        }
    }

    public StoryAudioDTO synthesize(StoryTtsRequestDTO requestDTO) {
        HttpRequest request = jsonRequest(
                "/api/v1/stories/tts/synthesize",
                requestDTO,
                TTS_TIMEOUT
        );
        long startedAt = System.nanoTime();
        try {
            HttpResponse<byte[]> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofByteArray()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String body = new String(response.body(), StandardCharsets.UTF_8);
                throw httpError(response.statusCode(), body);
            }

            String mediaType = response.headers()
                    .firstValue("Content-Type")
                    .orElse("audio/wav");
            String provider = response.headers()
                    .firstValue("X-TTS-Provider")
                    .orElse("UNKNOWN");
            String voice = response.headers()
                    .firstValue("X-TTS-Voice")
                    .orElse("UNKNOWN");
            log.info(
                    "STORY_AI_TTS_SUCCEEDED status={} elapsedMs={} "
                            + "textChars={} audioBytes={} provider={} voice={}",
                    response.statusCode(),
                    elapsedMillis(startedAt),
                    requestDTO.text().length(),
                    response.body().length,
                    provider,
                    voice
            );
            return new StoryAudioDTO(
                    response.body(),
                    mediaType,
                    provider,
                    voice
            );
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw connectionError("STORY_AI_TTS_INTERRUPTED", error, startedAt);
        } catch (IOException error) {
            throw connectionError("STORY_AI_TTS_CONNECTION_FAILED", error, startedAt);
        }
    }

    public StoryTtsStatusDTO getTtsStatus() {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(endpoint("/api/v1/stories/tts/status"))
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();
        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );
            requireSuccess(response.statusCode(), response.body());
            return objectMapper.readValue(
                    response.body(),
                    StoryTtsStatusDTO.class
            );
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new StoryAiException("STORY_AI_STATUS_INTERRUPTED", error);
        } catch (IOException error) {
            throw new StoryAiException("STORY_AI_STATUS_CONNECTION_FAILED", error);
        }
    }

    private HttpRequest jsonRequest(
            String path,
            Object body,
            Duration timeout
    ) {
        try {
            return HttpRequest.newBuilder()
                    .uri(endpoint(path))
                    .header("Content-Type", "application/json; charset=utf-8")
                    .timeout(timeout)
                    .POST(HttpRequest.BodyPublishers.ofString(
                            objectMapper.writeValueAsString(body),
                            StandardCharsets.UTF_8
                    ))
                    .build();
        } catch (IOException error) {
            throw new StoryAiException("STORY_AI_REQUEST_JSON_FAILED", error);
        }
    }

    private URI endpoint(String path) {
        String root = baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1)
                : baseUrl;
        return URI.create(root + path);
    }

    private void requireSuccess(int statusCode, String body) {
        if (statusCode < 200 || statusCode >= 300) {
            throw httpError(statusCode, body);
        }
    }

    private StoryAiException httpError(int statusCode, String body) {
        String detail = "";
        try {
            JsonNode root = objectMapper.readTree(body);
            detail = root.path("detail").asText("");
        } catch (Exception ignored) {
            // 오류 응답이 JSON이 아니면 HTTP 상태만 전달한다.
        }
        String suffix = detail.isBlank() ? "" : ":" + detail;
        log.warn(
                "STORY_AI_HTTP_FAILED status={} detail={}",
                statusCode,
                detail.isBlank() ? "NONE" : detail
        );
        return new StoryAiException("STORY_AI_HTTP_" + statusCode + suffix);
    }

    private StoryAiException connectionError(
            String code,
            Exception cause,
            long startedAt
    ) {
        log.error(
                "{} baseUrl={} elapsedMs={} reason={}",
                code,
                baseUrl,
                elapsedMillis(startedAt),
                cause.getClass().getSimpleName()
        );
        return new StoryAiException(code, cause);
    }

    private long elapsedMillis(long startedAt) {
        return Duration.ofNanos(System.nanoTime() - startedAt).toMillis();
    }
}
