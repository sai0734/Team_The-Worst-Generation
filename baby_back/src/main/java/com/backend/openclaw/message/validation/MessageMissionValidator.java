package com.backend.openclaw.message.validation;

import com.backend.openclaw.common.exception.MissionValidationException;
import com.backend.openclaw.message.dto.MessageRequestDTO;
import com.backend.openclaw.message.utils.PhoneNumberUtils;
import org.springframework.stereotype.Component;

@Component
public class MessageMissionValidator {

    public void validate(MessageRequestDTO request) {
        if (request == null) {
            throw new MissionValidationException(
                    "MESSAGE_REQUEST_REQUIRED"
            );
        }

        if (request.getSource() == null) {
            throw new MissionValidationException(
                    "MESSAGE_SOURCE_REQUIRED"
            );
        }

        String phone = PhoneNumberUtils.normalize(request.getTo());

        if (phone == null || phone.isBlank()) {
            throw new MissionValidationException(
                    "MESSAGE_TARGET_REQUIRED"
            );
        }

        if (!phone.matches("^01[016789][0-9]{7,8}$")) {
            throw new MissionValidationException(
                    "INVALID_MESSAGE_TARGET"
            );
        }

        if (request.getContent() == null
                || request.getContent().isBlank()) {
            throw new MissionValidationException(
                    "MESSAGE_CONTENT_REQUIRED"
            );
        }

        if (request.getContent().length() > 1000) {
            throw new MissionValidationException(
                    "MESSAGE_CONTENT_TOO_LONG"
            );
        }
    }
}