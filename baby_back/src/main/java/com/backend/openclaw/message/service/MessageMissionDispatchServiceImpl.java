package com.backend.openclaw.message.service;

import com.backend.openclaw.common.dto.MissionStatus;
import com.backend.openclaw.common.exception.OpenClawGatewayException;
import com.backend.openclaw.message.client.OpenClawMessageClient;
import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.backend.openclaw.message.dto.MessageMissionResultDTO;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Log4j2
public class MessageMissionDispatchServiceImpl
        implements MessageMissionDispatchService {

    private final OpenClawMessageClient openClawMessageClient;

    @Override
    public MessageMissionResultDTO dispatch(
            MessageMissionDTO mission
    ) {
        String missionId = mission.getMetadata().getMissionId();
        long startedAt = System.nanoTime();

        log.info(
                "MESSAGE_DISPATCH_START missionId={}, source={}, mode=LIVE_ONLY",
                missionId,
                mission.getMetadata().getSource()
        );

        try {
            JsonNode response =
                    openClawMessageClient.dispatchMission(mission);

            String resultMissionId =
                    response.path("missionId").asText("");

            if (!missionId.equals(resultMissionId)) {
                throw new OpenClawGatewayException(
                        "OPENCLAW_MISSION_ID_MISMATCH"
                );
            }

            MissionStatus status =
                    resolveStatus(
                            response.path("status").asText("")
                    );

            MessageMissionResultDTO result =
                    MessageMissionResultDTO.builder()
                            .missionId(resultMissionId)
                            .status(status)
                            .accepted(
                                    response.path("accepted")
                                            .asBoolean(false)
                            )
                            .to(
                                    response.path("to")
                                            .asText(mission.getTo())
                            )
                            .build();

            log.info(
                    "MESSAGE_DISPATCH_SUCCESS missionId={}, status={}, accepted={}, elapsedMs={}",
                    result.getMissionId(),
                    result.getStatus(),
                    result.isAccepted(),
                    elapsedMillis(startedAt)
            );

            return result;
        } catch (RuntimeException exception) {
            log.error(
                    "MESSAGE_DISPATCH_FAILED missionId={}, source={}, reason={}, elapsedMs={}",
                    missionId,
                    mission.getMetadata().getSource(),
                    exception.getMessage(),
                    elapsedMillis(startedAt),
                    exception
            );
            throw exception;
        }
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }

    private MissionStatus resolveStatus(String status) {
        try {
            return MissionStatus.valueOf(status);
        } catch (IllegalArgumentException exception) {
            throw new OpenClawGatewayException(
                    "OPENCLAW_MISSION_STATUS_INVALID",
                    exception
            );
        }
    }
}
