package com.backend.service;

import com.backend.openclaw.common.dto.MissionMetadataDTO;
import com.backend.openclaw.common.dto.MissionSource;
import com.backend.openclaw.common.exception.OpenClawGatewayException;
import com.backend.openclaw.message.client.OpenClawMessageClient;
import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Log4j2
class OpenClawMessageClientTests {

    private static final String GATEWAY_TOKEN =
            "test-gateway-token";

    private final ObjectMapper objectMapper =
            new ObjectMapper().findAndRegisterModules();

    private OpenClawMessageClient client;
    private HttpServer server;

    @BeforeEach
    void setUp() {
        client = new OpenClawMessageClient(objectMapper);

        ReflectionTestUtils.setField(
                client,
                "gatewayToken",
                GATEWAY_TOKEN
        );
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void dispatchMissionThroughAgentApi() throws Exception {
        AtomicReference<String> authorization =
                new AtomicReference<>();
        AtomicReference<String> requestBody =
                new AtomicReference<>();

        startServer(
                200,
                """
                {
                  "choices": [
                    {
                      "message": {
                        "content": "{\\"missionId\\":\\"msg_test\\",\\"provider\\":\\"ANDROID_SMS\\",\\"status\\":\\"SUCCESS\\",\\"accepted\\":true}"
                      }
                    }
                  ]
                }
                """,
                authorization,
                requestBody
        );

        JsonNode result =
                client.dispatchMission(createMission());

        JsonNode sentBody =
                objectMapper.readTree(requestBody.get());
        JsonNode sentMission =
                objectMapper.readTree(
                        sentBody.path("messages")
                                .get(1)
                                .path("content")
                                .asText()
                );

        log.info(
                "OpenClaw agent request verified: model={}, missionId={}, status={}",
                sentBody.path("model").asText(),
                sentMission.path("metadata").path("missionId").asText(),
                result.path("status").asText()
        );

        assertEquals(
                "Bearer " + GATEWAY_TOKEN,
                authorization.get()
        );
        assertEquals(
                "openclaw/message-dispatcher",
                sentBody.path("model").asText()
        );
        assertEquals(
                "msg_test",
                sentMission.path("metadata")
                        .path("missionId")
                        .asText()
        );
        assertEquals(5, sentMission.path("metadata").size());
        assertEquals(
                "SUCCESS",
                result.path("status").asText()
        );
    }

    @Test
    void rejectRequestWithoutGatewayToken() {
        ReflectionTestUtils.setField(
                client,
                "baseUrl",
                "http://127.0.0.1:18789"
        );
        ReflectionTestUtils.setField(
                client,
                "gatewayToken",
                ""
        );

        OpenClawGatewayException exception =
                assertThrows(
                        OpenClawGatewayException.class,
                        () -> client.dispatchMission(createMission())
                );

        log.info(
                "Missing gateway token rejected: {}",
                exception.getMessage()
        );

        assertEquals(
                "OPENCLAW_GATEWAY_TOKEN_REQUIRED",
                exception.getMessage()
        );
    }

    @Test
    void propagateGatewayHttpError() throws Exception {
        startServer(
                500,
                """
                {
                  "error": {
                    "message": "gateway failed"
                  }
                }
                """,
                new AtomicReference<>(),
                new AtomicReference<>()
        );

        OpenClawGatewayException exception =
                assertThrows(
                        OpenClawGatewayException.class,
                        () -> client.dispatchMission(createMission())
                );

        log.info(
                "Gateway HTTP error propagated: {}",
                exception.getMessage()
        );

        assertEquals(
                "OPENCLAW_HTTP_500: gateway failed",
                exception.getMessage()
        );
    }

    private void startServer(
            int statusCode,
            String responseBody,
            AtomicReference<String> authorization,
            AtomicReference<String> requestBody
    ) throws IOException {
        server = HttpServer.create(
                new InetSocketAddress("127.0.0.1", 0),
                0
        );

        server.createContext(
                "/v1/chat/completions",
                exchange -> {
                    authorization.set(
                            exchange.getRequestHeaders()
                                    .getFirst("Authorization")
                    );
                    requestBody.set(
                            new String(
                                    exchange.getRequestBody()
                                            .readAllBytes(),
                                    StandardCharsets.UTF_8
                            )
                    );

                    byte[] responseBytes =
                            responseBody.getBytes(
                                    StandardCharsets.UTF_8
                            );

                    exchange.getResponseHeaders()
                            .add(
                                    "Content-Type",
                                    "application/json"
                            );
                    exchange.sendResponseHeaders(
                            statusCode,
                            responseBytes.length
                    );
                    exchange.getResponseBody()
                            .write(responseBytes);
                    exchange.close();
                }
        );
        server.start();

        ReflectionTestUtils.setField(
                client,
                "baseUrl",
                "http://127.0.0.1:"
                        + server.getAddress().getPort()
        );
    }

    private MessageMissionDTO createMission() {
        MissionMetadataDTO metadata =
                MissionMetadataDTO.builder()
                        .schemaVersion(1)
                        .missionId("msg_test")
                        .source(MissionSource.SOS)
                        .requestedBy("tester@example.com")
                        .requestedAt(Instant.parse(
                                "2026-08-19T07:00:00Z"
                        ))
                        .build();

        return MessageMissionDTO.builder()
                .metadata(metadata)
                .to("01012345678")
                .content("예약이 완료되었습니다.")
                .build();
    }
}
