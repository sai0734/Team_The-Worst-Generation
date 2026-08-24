package com.backend.openclaw.message.service;

import com.backend.openclaw.common.dto.MissionMetadataDTO;
import com.backend.openclaw.common.exception.MissionValidationException;
import com.backend.openclaw.common.utils.MissionRequesterResolver;
import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.backend.openclaw.message.dto.MessageRequestDTO;
import com.backend.openclaw.message.utils.PhoneNumberUtils;
import com.backend.openclaw.message.validation.MessageMissionValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class MessageMissionServiceImpl implements MessageMissionService {

    private final MessageMissionValidator messageMissionValidator;

    @Override
    public MessageMissionDTO createMission(MessageRequestDTO request, String requestedBy) {
        try {
            messageMissionValidator.validate(request);
        } catch (RuntimeException exception) {
            log.warn(
                    "MESSAGE_MISSION_VALIDATION_FAILED source={}, reason={}",
                    request == null ? null : request.getSource(),
                    exception.getMessage(),
                    exception
            );
            throw exception;
        }

        String normalizedPhone =
                PhoneNumberUtils.normalize(request.getTo());

        String requester =
                MissionRequesterResolver.resolve(requestedBy);
        MissionMetadataDTO metadata =
                MissionMetadataDTO.builder()
                        .missionId("msg_" + UUID.randomUUID())
                        .source(request.getSource())
                        .requestedBy(requester)
                        .requestedAt(Instant.now())
                        .build();
        MessageMissionDTO mission = MessageMissionDTO.builder()
                .metadata(metadata)
                .to(normalizedPhone)
                .content(request.getContent().trim())
                .build();

        log.info(
                "MESSAGE_MISSION_CREATED missionId={}, source={}, contentLength={}, mode=LIVE_ONLY",
                metadata.getMissionId(),
                metadata.getSource(),
                mission.getContent().length()
        );

        return mission;
    }


}
