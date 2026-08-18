package com.backend.openclaw.message.controller;

import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.backend.openclaw.message.dto.MessageRequestDTO;
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

    @PostMapping
    public MessageMissionDTO createMessageMission(Principal principal, @RequestBody MessageRequestDTO request){
        String requestedBy = principal == null ? null : principal.getName();

        MessageMissionDTO mission = messageMissionService.createMission(request, requestedBy);

        return mission;
    }
}
