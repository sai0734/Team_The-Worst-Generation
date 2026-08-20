package com.backend.service;

import com.backend.openclaw.common.dto.MissionMetadataDTO;
import com.backend.openclaw.common.dto.MissionSource;
import com.backend.openclaw.common.dto.MissionStatus;
import com.backend.openclaw.common.exception.OpenClawGatewayException;
import com.backend.openclaw.message.client.OpenClawMessageClient;
import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.backend.openclaw.message.dto.MessageMissionResultDTO;
import com.backend.openclaw.message.service.MessageMissionDispatchService;
import com.backend.openclaw.message.service.MessageMissionDispatchServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Log4j2
class MessageMissionDispatchServiceTests {

    private final ObjectMapper objectMapper =
            new ObjectMapper();

    private OpenClawMessageClient openClawMessageClient;
    private MessageMissionDispatchService service;

    @BeforeEach
    void setUp() {
        openClawMessageClient =
                mock(OpenClawMessageClient.class);

        service =
                new MessageMissionDispatchServiceImpl(
                        openClawMessageClient
                );
    }

    @Test
    void dispatchDryRunMissionSuccessfully() {
        MessageMissionDTO mission = createMission();

        when(openClawMessageClient.dispatchMission(mission))
                .thenReturn(
                        objectMapper.createObjectNode()
                                .put("missionId", "msg_test")
                                .put("status", "DRY_RUN")
                                .put("accepted", true)
                                .put("to", "01012345678")
                );

        MessageMissionResultDTO result =
                service.dispatch(mission);

        log.info(
                "Dispatch success: missionId={}, status={}, accepted={}, to={}",
                result.getMissionId(),
                result.getStatus(),
                result.isAccepted(),
                result.getTo()
        );

        assertEquals(
                "msg_test",
                result.getMissionId()
        );
        assertEquals(
                MissionStatus.DRY_RUN,
                result.getStatus()
        );
        assertTrue(result.isAccepted());
        assertEquals(
                "01012345678",
                result.getTo()
        );
    }

    @Test
    void rejectMismatchedMissionId() {
        MessageMissionDTO mission = createMission();

        when(openClawMessageClient.dispatchMission(mission))
                .thenReturn(
                        objectMapper.createObjectNode()
                                .put("missionId", "msg_other")
                                .put("status", "DRY_RUN")
                                .put("accepted", true)
                );

        OpenClawGatewayException exception =
                assertThrows(
                        OpenClawGatewayException.class,
                        () -> service.dispatch(mission)
                );

        log.info(
                "Mission ID mismatch rejected: {}",
                exception.getMessage()
        );

        assertEquals(
                "OPENCLAW_MISSION_ID_MISMATCH",
                exception.getMessage()
        );
    }

    @Test
    void rejectInvalidMissionStatus() {
        MessageMissionDTO mission = createMission();

        when(openClawMessageClient.dispatchMission(mission))
                .thenReturn(
                        objectMapper.createObjectNode()
                                .put("missionId", "msg_test")
                                .put("status", "UNKNOWN")
                                .put("accepted", false)
                );

        OpenClawGatewayException exception =
                assertThrows(
                        OpenClawGatewayException.class,
                        () -> service.dispatch(mission)
                );

        log.info(
                "Invalid mission status rejected: {}",
                exception.getMessage()
        );

        assertEquals(
                "OPENCLAW_MISSION_STATUS_INVALID",
                exception.getMessage()
        );
    }

    private MessageMissionDTO createMission() {
        MissionMetadataDTO metadata =
                MissionMetadataDTO.builder()
                        .schemaVersion(1)
                        .missionId("msg_test")
                        .source(MissionSource.SOS)
                        .dryRun(true)
                        .requestedBy("tester@example.com")
                        .requestedAt(Instant.now())
                        .build();

        return MessageMissionDTO.builder()
                .metadata(metadata)
                .to("01012345678")
                .content("예약이 완료되었습니다.")
                .build();
    }
}