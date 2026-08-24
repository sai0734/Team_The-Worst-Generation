package com.backend.service;

import com.backend.hospital.emergency.dto.EmergencyRoomSOSResponseDTO;
import com.backend.hospital.emergency.service.EmergencyRoomSOSNoticeService;
import com.backend.hospital.emergency.service.EmergencyRoomSOSNoticeServiceImpl;
import com.backend.openclaw.common.dto.MissionMetadataDTO;
import com.backend.openclaw.common.dto.MissionSource;
import com.backend.openclaw.common.dto.MissionStatus;
import com.backend.openclaw.common.exception.OpenClawGatewayException;
import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.backend.openclaw.message.dto.MessageMissionResultDTO;
import com.backend.openclaw.message.dto.MessageRequestDTO;
import com.backend.openclaw.message.service.MessageMissionDispatchService;
import com.backend.openclaw.message.service.MessageMissionService;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Log4j2
class EmergencyRoomSOSNoticeServiceTests {

    private MessageMissionService messageMissionService;
    private MessageMissionDispatchService messageMissionDispatchService;
    private EmergencyRoomSOSNoticeService noticeService;

    @BeforeEach
    void setUp() {
        messageMissionService = mock(MessageMissionService.class);
        messageMissionDispatchService = mock(MessageMissionDispatchService.class);
        noticeService = new EmergencyRoomSOSNoticeServiceImpl(
                messageMissionService,
                messageMissionDispatchService
        );
    }

    @Test
    void dispatchGuardianNotice() {
        EmergencyRoomSOSResponseDTO hospital = createHospital();
        MessageMissionDTO mission = createMission();

        when(messageMissionService.createMission(any(), eq("user@example.com")))
                .thenReturn(mission);
        when(messageMissionDispatchService.dispatch(mission))
                .thenReturn(
                        MessageMissionResultDTO.builder()
                                .missionId("msg_sos")
                                .status(MissionStatus.SUCCESS)
                                .accepted(true)
                                .to("01012345678")
                                .build()
                );

        noticeService.notifyGuardian(hospital, "01012345678", "user@example.com");

        ArgumentCaptor<MessageRequestDTO> requestCaptor =
                ArgumentCaptor.forClass(MessageRequestDTO.class);

        verify(messageMissionService, timeout(2000)).createMission(
                requestCaptor.capture(),
                eq("user@example.com")
        );
        verify(messageMissionDispatchService, timeout(2000)).dispatch(mission);

        MessageRequestDTO sent = requestCaptor.getValue();

        log.info(
                "SOS notice request: source={}, to={}, content={}",
                sent.getSource(),
                sent.getTo(),
                sent.getContent()
        );

        assertEquals(MissionSource.SOS, sent.getSource());
        assertEquals("01012345678", sent.getTo());
        assertEquals(
                "[응급 요청] 삼성서울병원 / 서울특별시 강남구 일원로 81",
                sent.getContent()
        );
    }

    @Test
    void swallowNoticeFailure() {
        when(messageMissionService.createMission(any(), any()))
                .thenThrow(new OpenClawGatewayException("OPENCLAW_HTTP_405"));

        assertDoesNotThrow(
                () -> noticeService.notifyGuardian(
                        createHospital(),
                        "01012345678",
                        "user@example.com"
                )
        );

        verify(messageMissionService, timeout(2000)).createMission(any(), any());
        verify(messageMissionDispatchService, never()).dispatch(any());
    }

    private EmergencyRoomSOSResponseDTO createHospital() {
        return EmergencyRoomSOSResponseDTO.builder()
                .hospitalId("A1100010")
                .hospitalName("삼성서울병원")
                .address("서울특별시 강남구 일원로 81")
                .build();
    }

    private MessageMissionDTO createMission() {
        return MessageMissionDTO.builder()
                .metadata(
                        MissionMetadataDTO.builder()
                                .missionId("msg_sos")
                                .source(MissionSource.SOS)
                                .requestedBy("user@example.com")
                                .build()
                )
                .to("01012345678")
                .content("[응급 요청] 삼성서울병원 / 서울특별시 강남구 일원로 81")
                .build();
    }
}
