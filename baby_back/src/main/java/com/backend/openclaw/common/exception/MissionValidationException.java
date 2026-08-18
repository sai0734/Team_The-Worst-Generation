package com.backend.openclaw.common.exception;

public class MissionValidationException extends IllegalArgumentException {

    public MissionValidationException(String message) {
        super(message);
    }
}