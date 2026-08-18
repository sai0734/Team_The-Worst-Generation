package com.backend.service;

import com.backend.openclaw.common.dto.MissionSource;
import com.backend.openclaw.common.exception.MissionValidationException;
import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.backend.openclaw.message.dto.MessageRequestDTO;
import com.backend.openclaw.message.service.MessageMissionService;
import com.backend.openclaw.message.service.MessageMissionServiceImpl;
import com.backend.openclaw.message.validation.MessageMissionValidator;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@Log4j2
class MessageMissionServiceTests {

    private MessageMissionService service;

    @BeforeEach
    void setUp() {
        MessageMissionValidator validator =
                new MessageMissionValidator();

        service = new MessageMissionServiceImpl(validator);
    }

    @Test
    void createMissionSuccessfully() {
        MessageRequestDTO request =
                MessageRequestDTO.builder()
                        .source(MissionSource.SOS)
                        .to("010-1234-5678")
                        .content("  Emergency message test  ")
                        .build();

        MessageMissionDTO result =
                service.createMission(
                        request,
                        " user@example.com "
                );

        log.info("Mission created successfully");
        log.info("missionId={}",
                result.getMetadata().getMissionId());
        log.info("schemaVersion={}",
                result.getMetadata().getSchemaVersion());
        log.info("source={}",
                result.getMetadata().getSource());
        log.info("dryRun={}",
                result.getMetadata().isDryRun());
        log.info("requestedBy={}",
                result.getMetadata().getRequestedBy());
        log.info("requestedAt={}",
                result.getMetadata().getRequestedAt());
        log.info("to={}", result.getTo());
        log.info("content={}", result.getContent());

        assertNotNull(result);
        assertNotNull(result.getMetadata());

        assertEquals(
                MissionSource.SOS,
                result.getMetadata().getSource()
        );
        assertEquals(
                1,
                result.getMetadata().getSchemaVersion()
        );
        assertTrue(result.getMetadata().isDryRun());
        assertTrue(
                result.getMetadata()
                        .getMissionId()
                        .startsWith("msg_")
        );
        assertEquals(
                "user@example.com",
                result.getMetadata().getRequestedBy()
        );
        assertNotNull(result.getMetadata().getRequestedAt());
        assertEquals("01012345678", result.getTo());
        assertEquals(
                "Emergency message test",
                result.getContent()
        );
    }

    @Test
    void throwExceptionForInvalidPhoneNumber() {
        MessageRequestDTO request =
                MessageRequestDTO.builder()
                        .source(MissionSource.SOS)
                        .to("1234")
                        .content("Message test")
                        .build();

        MissionValidationException exception =
                assertThrows(
                        MissionValidationException.class,
                        () -> service.createMission(
                                request,
                                "user@example.com"
                        )
                );

        log.info(
                "Invalid phone validation succeeded: {}",
                exception.getMessage()
        );

        assertEquals(
                "INVALID_MESSAGE_TARGET",
                exception.getMessage()
        );
    }

    @Test
    void throwExceptionWhenRequesterIsMissing() {
        MessageRequestDTO request =
                MessageRequestDTO.builder()
                        .source(MissionSource.SOS)
                        .to("01012345678")
                        .content("Message test")
                        .build();

        MissionValidationException exception =
                assertThrows(
                        MissionValidationException.class,
                        () -> service.createMission(request, null)
                );

        log.info(
                "Missing requester validation succeeded: {}",
                exception.getMessage()
        );

        assertEquals(
                "MESSAGE_REQUESTER_REQUIRED",
                exception.getMessage()
        );
    }
}