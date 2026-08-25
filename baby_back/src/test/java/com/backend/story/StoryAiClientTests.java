package com.backend.story;

import com.backend.story.client.StoryAiClient;
import com.backend.story.dto.StoryAudioDTO;
import com.backend.story.dto.StoryGenerateRequestDTO;
import com.backend.story.dto.StoryGenerateResponseDTO;
import com.backend.story.dto.StoryTtsRequestDTO;
import com.backend.story.exception.StoryAiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class StoryAiClientTests {

    private final ObjectMapper objectMapper =
            new ObjectMapper().findAndRegisterModules();
    private final StoryAiClient client =
            new StoryAiClient(objectMapper);
    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void generateSendsProfileAndParsesStory() throws Exception {
        AtomicReference<byte[]> requestBody = new AtomicReference<>();
        startServer(
                "/api/v1/stories/generate",
                200,
                """
                {
                  "storyId":"story_test",
                  "title":"별빛 동화",
                  "content":"따뜻한 이야기",
                  "generationMode":"LLM",
                  "characterCount":7,
                  "sceneCount":4
                }
                """.getBytes(StandardCharsets.UTF_8),
                Map.of("Content-Type", "application/json"),
                requestBody
        );

        StoryGenerateResponseDTO result = client.generate(
                new StoryGenerateRequestDTO(
                        "서윤",
                        36,
                        List.of("토끼"),
                        List.of("분홍 인형"),
                        "BEDTIME"
                )
        );

        JsonNode sent = objectMapper.readTree(requestBody.get());
        assertEquals("서윤", sent.path("babyName").asText());
        assertEquals("토끼", sent.path("interests").get(0).asText());
        assertEquals(true, sent.path("length").isMissingNode());
        assertEquals("story_test", result.storyId());
        assertEquals(4, result.sceneCount());
    }

    @Test
    void synthesizeReturnsAudioAndProviderHeaders() throws Exception {
        byte[] wav = "RIFF-test-WAVE".getBytes(StandardCharsets.US_ASCII);
        startServer(
                "/api/v1/stories/tts/synthesize",
                200,
                wav,
                Map.of(
                        "Content-Type", "audio/wav",
                        "X-TTS-Provider", "PIPER",
                        "X-TTS-Voice", "ko_KR-kss-medium"
                ),
                new AtomicReference<>()
        );

        StoryAudioDTO result = client.synthesize(
                new StoryTtsRequestDTO("따뜻한 이야기")
        );

        assertArrayEquals(wav, result.content());
        assertEquals("audio/wav", result.mediaType());
        assertEquals("PIPER", result.provider());
        assertEquals("ko_KR-kss-medium", result.voice());
    }

    @Test
    void propagatePythonErrorDetail() throws Exception {
        startServer(
                "/api/v1/stories/generate",
                503,
                """
                {"detail":"STORY_LLM_CONNECTION_FAILED"}
                """.getBytes(StandardCharsets.UTF_8),
                Map.of("Content-Type", "application/json"),
                new AtomicReference<>()
        );

        StoryAiException error = assertThrows(
                StoryAiException.class,
                () -> client.generate(new StoryGenerateRequestDTO(
                        "서윤",
                        36,
                        List.of(),
                        List.of(),
                        "BEDTIME"
                ))
        );

        assertEquals(
                "STORY_AI_HTTP_503:STORY_LLM_CONNECTION_FAILED",
                error.getMessage()
        );
    }

    private void startServer(
            String path,
            int statusCode,
            byte[] responseBody,
            Map<String, String> responseHeaders,
            AtomicReference<byte[]> requestBody
    ) throws IOException {
        server = HttpServer.create(
                new InetSocketAddress("127.0.0.1", 0),
                0
        );
        server.createContext(path, exchange -> {
            requestBody.set(exchange.getRequestBody().readAllBytes());
            responseHeaders.forEach(
                    (name, value) -> exchange.getResponseHeaders().add(name, value)
            );
            exchange.sendResponseHeaders(statusCode, responseBody.length);
            exchange.getResponseBody().write(responseBody);
            exchange.close();
        });
        server.start();
        ReflectionTestUtils.setField(
                client,
                "baseUrl",
                "http://127.0.0.1:" + server.getAddress().getPort()
        );
    }
}
