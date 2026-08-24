package com.backend.hospital.emergency.service;

import com.backend.hospital.emergency.dto.EmergencyRoomSOSResponseDTO;
import com.backend.openclaw.common.dto.MissionSource;
import com.backend.openclaw.message.dto.MessageRequestDTO;
import com.backend.openclaw.message.service.MessageMissionDispatchService;
import com.backend.openclaw.message.service.MessageMissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Log4j2
public class EmergencyRoomSOSNoticeServiceImpl
        implements EmergencyRoomSOSNoticeService {

    private final MessageMissionService messageMissionService;
    private final MessageMissionDispatchService messageMissionDispatchService;

    @Override
    public void notifyGuardian(
            EmergencyRoomSOSResponseDTO hospital,
            String notificationPhone,
            String memberEmail
    ) {
        log.info(
                "SOS_NOTICE_SCHEDULED hospitalId={}, mode=LIVE_ONLY",
                hospital.getHospitalId()
        );

        CompletableFuture.runAsync(
                () -> sendGuardianNotice(hospital, notificationPhone, memberEmail)
        );
    }

    private void sendGuardianNotice(
            EmergencyRoomSOSResponseDTO hospital,
            String notificationPhone,
            String memberEmail
    ) {
        String missionId = "<not-created>";

        try {
            var mission = messageMissionService.createMission(
                    MessageRequestDTO.builder()
                            .source(MissionSource.SOS)
                            .to(notificationPhone)
                            .content(guardianNoticeContent(hospital))
                            .build(),
                    memberEmail
            );
            missionId = mission.getMetadata().getMissionId();

            log.info(
                    "SOS_NOTICE_DISPATCH_START hospitalId={}, missionId={}",
                    hospital.getHospitalId(),
                    missionId
            );

            var result = messageMissionDispatchService.dispatch(mission);

            log.info(
                    "SOS_NOTICE_DISPATCH_SUCCESS hospitalId={}, missionId={}, "
                            + "status={}, accepted={}",
                    hospital.getHospitalId(),
                    result.getMissionId(),
                    result.getStatus(),
                    result.isAccepted()
            );
        } catch (Exception exception) {
            log.error(
                    "SOS_NOTICE_DISPATCH_FAILED hospitalId={}, missionId={}, reason={}",
                    hospital.getHospitalId(),
                    missionId,
                    exception.getMessage(),
                    exception
            );
        }
    }

    private String guardianNoticeContent(EmergencyRoomSOSResponseDTO hospital) {
        String hospitalName = hospital.getHospitalName() == null
                || hospital.getHospitalName().isBlank()
                ? "응급실"
                : hospital.getHospitalName().trim();

        String address = hospital.getAddress() == null
                || hospital.getAddress().isBlank()
                ? ""
                : " / " + hospital.getAddress().trim();

        return "[응급 요청] " + hospitalName + address;
    }
}
