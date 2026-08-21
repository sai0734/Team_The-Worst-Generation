package com.backend.openclaw.message.service;

import com.backend.openclaw.common.dto.MissionMetadataDTO;
import com.backend.openclaw.common.exception.MissionValidationException;
import com.backend.openclaw.common.utils.MissionRequesterResolver;
import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.backend.openclaw.message.dto.MessageRequestDTO;
import com.backend.openclaw.message.utils.PhoneNumberUtils;
import com.backend.openclaw.message.validation.MessageMissionValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageMissionServiceImpl implements MessageMissionService {

    private final MessageMissionValidator messageMissionValidator;

    @Value("${openclaw.message.dry-run:true}")
    private boolean dryRun = true;

    @Override
    public MessageMissionDTO createMission(MessageRequestDTO request, String requestedBy) {
        messageMissionValidator.validate(request);

        String normalizedPhone =
                PhoneNumberUtils.normalize(request.getTo());

        String requester =
                MissionRequesterResolver.resolve(requestedBy);
        MissionMetadataDTO metadata =
                MissionMetadataDTO.builder()
                        .missionId("msg_" + UUID.randomUUID())
                        .source(request.getSource())
                        .dryRun(dryRun)
                        .requestedBy(requester)
                        .requestedAt(Instant.now())
                        .build();
        return MessageMissionDTO.builder()
                .metadata(metadata)
                .to(normalizedPhone)
                .content(request.getContent().trim())
                .build();
    }


}