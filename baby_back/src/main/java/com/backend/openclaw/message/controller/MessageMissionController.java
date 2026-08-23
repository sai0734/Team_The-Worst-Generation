package com.backend.openclaw.message.controller;

import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.backend.openclaw.message.dto.MessageMissionResultDTO;
import com.backend.openclaw.message.dto.MessageRequestDTO;
import com.backend.openclaw.message.service.MessageMissionDispatchService;
import com.backend.openclaw.message.service.MessageMissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/openclaw-missions/messages")
@RequiredArgsConstructor
@Log4j2
public class MessageMissionController {

    private final MessageMissionService messageMissionService;
    private final MessageMissionDispatchService dispatchService;

    @PostMapping
    public MessageMissionResultDTO createMessageMission(
            Principal principal,
            @RequestBody MessageRequestDTO request
    ) {
        log.info(
                "MESSAGE_MISSION_API_RECEIVED source={}, authenticated={}",
                request == null ? null : request.getSource(),
                principal != null
        );

        String requestedBy =
                principal == null
                        ? null
                        : principal.getName();

        MessageMissionDTO mission =
                messageMissionService.createMission(
                        request,
                        requestedBy
                );

        MessageMissionResultDTO result =
                dispatchService.dispatch(mission);

        log.info(
                "MESSAGE_MISSION_API_COMPLETED missionId={}, status={}, accepted={}",
                result.getMissionId(),
                result.getStatus(),
                result.isAccepted()
        );

        return result;
    }
}
