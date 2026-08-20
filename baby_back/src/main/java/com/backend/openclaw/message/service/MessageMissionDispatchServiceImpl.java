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
        JsonNode response =
                openClawMessageClient.dispatchMission(mission);

        String resultMissionId =
                response.path("missionId").asText("");

        if (!mission.getMetadata()
                .getMissionId()
                .equals(resultMissionId)) {
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
                "OpenClaw message mission dispatched: "
                        + "missionId={}, status={}, accepted={}",
                result.getMissionId(),
                result.getStatus(),
                result.isAccepted()
        );

        return result;
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