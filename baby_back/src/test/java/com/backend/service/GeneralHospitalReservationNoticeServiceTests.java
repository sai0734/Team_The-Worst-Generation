package com.backend.service;

import com.backend.hospital.general.domain.GeneralHospitalReservation;
import com.backend.hospital.general.service.GeneralHospitalReservationNoticeService;
import com.backend.hospital.general.service.GeneralHospitalReservationNoticeServiceImpl;
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

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@Log4j2
class GeneralHospitalReservationNoticeServiceTests {

    private MessageMissionService messageMissionService;
    private MessageMissionDispatchService messageMissionDispatchService;
    private GeneralHospitalReservationNoticeService noticeService;

    @BeforeEach
    void setUp() {
        messageMissionService = mock(MessageMissionService.class);
        messageMissionDispatchService = mock(MessageMissionDispatchService.class);
        noticeService = new GeneralHospitalReservationNoticeServiceImpl(
                messageMissionService,
                messageMissionDispatchService
        );
    }

    @Test
    void dispatchGuardianNotice() {
        GeneralHospitalReservation reservation = createReservation();
        MessageMissionDTO mission = createMission();

        when(messageMissionService.createMission(any(), eq("user@example.com")))
                .thenReturn(mission);
        when(messageMissionDispatchService.dispatch(mission))
                .thenReturn(
                        MessageMissionResultDTO.builder()
                                .missionId("msg_reservation")
                                .status(MissionStatus.DRY_RUN)
                                .accepted(true)
                                .to("01012345678")
                                .build()
                );

        noticeService.notifyAfterCommit(reservation);

        ArgumentCaptor<MessageRequestDTO> requestCaptor =
                ArgumentCaptor.forClass(MessageRequestDTO.class);

        verify(messageMissionService).createMission(
                requestCaptor.capture(),
                eq("user@example.com")
        );
        verify(messageMissionDispatchService).dispatch(mission);

        MessageRequestDTO sent = requestCaptor.getValue();

        log.info(
                "Reservation notice request: source={}, to={}, content={}",
                sent.getSource(),
                sent.getTo(),
                sent.getContent()
        );

        assertEquals(MissionSource.HOSPITAL_RESERVATION, sent.getSource());
        assertEquals("01012345678", sent.getTo());
        assertEquals(
                "[예약 접수] 아이봄소아과 / 2026-08-20 15:00 / 아이봄",
                sent.getContent()
        );
    }

    @Test
    void swallowNoticeFailure() {
        when(messageMissionService.createMission(any(), any()))
                .thenThrow(new OpenClawGatewayException("OPENCLAW_HTTP_405"));

        assertDoesNotThrow(
                () -> noticeService.notifyAfterCommit(createReservation())
        );
        verify(messageMissionDispatchService, never()).dispatch(any());
    }

    private GeneralHospitalReservation createReservation() {
        return GeneralHospitalReservation.builder()
                .reservationNo(1L)
                .memberEmail("user@example.com")
                .hospitalId("HOSP-001")
                .hospitalName("아이봄소아과")
                .notificationPhone("01012345678")
                .reservationDate(LocalDate.of(2026, 8, 20))
                .reservationTime("15:00")
                .patientName("아이봄")
                .build();
    }

    private MessageMissionDTO createMission() {
        return MessageMissionDTO.builder()
                .metadata(
                        MissionMetadataDTO.builder()
                                .missionId("msg_reservation")
                                .source(MissionSource.HOSPITAL_RESERVATION)
                                .dryRun(true)
                                .requestedBy("user@example.com")
                                .build()
                )
                .to("01012345678")
                .content("[예약 접수] 아이봄소아과 / 2026-08-20 15:00 / 아이봄")
                .build();
    }
}
