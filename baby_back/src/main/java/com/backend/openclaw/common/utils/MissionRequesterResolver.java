package com.backend.openclaw.common.utils;

import com.backend.openclaw.common.exception.MissionValidationException;

public final class MissionRequesterResolver {

    private MissionRequesterResolver() {
    }

    public static String resolve(String requestedBy) {
        if (requestedBy == null || requestedBy.isBlank()) {
            throw new MissionValidationException(
                    "MESSAGE_REQUESTER_REQUIRED"
            );
        }

        return requestedBy.trim();
    }
}