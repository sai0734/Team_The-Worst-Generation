package com.backend.openclaw.common.exception;

public class OpenClawGatewayException extends RuntimeException {

    public OpenClawGatewayException(String message) {
        super(message);
    }

    public OpenClawGatewayException(String message, Throwable cause) {
        super(message, cause);
    }
}