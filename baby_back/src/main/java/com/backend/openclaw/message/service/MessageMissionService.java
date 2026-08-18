package com.backend.openclaw.message.service;

import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.backend.openclaw.message.dto.MessageRequestDTO;

public interface MessageMissionService {

    MessageMissionDTO createMission(MessageRequestDTO request, String requestedBy);
}
