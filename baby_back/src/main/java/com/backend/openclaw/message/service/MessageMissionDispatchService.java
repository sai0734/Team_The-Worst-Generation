package com.backend.openclaw.message.service;

import com.backend.openclaw.message.dto.MessageMissionDTO;
import com.backend.openclaw.message.dto.MessageMissionResultDTO;

public interface MessageMissionDispatchService {

    MessageMissionResultDTO dispatch(
            MessageMissionDTO mission
    );
}