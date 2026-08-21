package com.backend.hospital.general.service;

import com.backend.hospital.general.domain.GeneralHospitalReservation;
import com.backend.openclaw.common.dto.MissionSource;
import com.backend.openclaw.message.dto.MessageRequestDTO;
import com.backend.openclaw.message.service.MessageMissionDispatchService;
import com.backend.openclaw.message.service.MessageMissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Log4j2
public class GeneralHospitalReservationNoticeServiceImpl
        implements GeneralHospitalReservationNoticeService {

    private final MessageMissionService messageMissionService;
    private final MessageMissionDispatchService messageMissionDispatchService;

    @Override
    public void notifyAfterCommit(GeneralHospitalReservation reservation) {
        Runnable dispatch = () -> notifyGuardian(reservation);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            CompletableFuture.runAsync(dispatch);
                        }
                    }
            );
            return;
        }

        dispatch.run();
    }

    private void notifyGuardian(GeneralHospitalReservation reservation) {
        try {
            var mission = messageMissionService.createMission(
                    MessageRequestDTO.builder()
                            .source(MissionSource.HOSPITAL_RESERVATION)
                            .to(reservation.getNotificationPhone())
                            .content(guardianNoticeContent(reservation))
                            .build(),
                    reservation.getMemberEmail()
            );

            var result = messageMissionDispatchService.dispatch(mission);

            log.info(
                    "Reservation notice dispatched: reservationNo={}, missionId={}, status={}",
                    reservation.getReservationNo(),
                    result.getMissionId(),
                    result.getStatus()
            );
        } catch (Exception exception) {
            log.warn(
                    "Reservation notice failed: reservationNo={}, reason={}",
                    reservation.getReservationNo(),
                    exception.getMessage()
            );
        }
    }

    private String guardianNoticeContent(GeneralHospitalReservation reservation) {
        String patientName = reservation.getPatientName() == null
                || reservation.getPatientName().isBlank()
                ? "환자"
                : reservation.getPatientName().trim();

        return "[예약 접수] "
                + reservation.getHospitalName()
                + " / "
                + reservation.getReservationDate()
                + " "
                + reservation.getReservationTime()
                + " / "
                + patientName;
    }
}
