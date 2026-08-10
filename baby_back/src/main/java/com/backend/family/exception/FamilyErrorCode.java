package com.backend.family.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FamilyErrorCode {

    INVALID_FAMILY_CREATE_REQUEST(HttpStatus.BAD_REQUEST),
    INVALID_FAMILY_JOIN_REQUEST(HttpStatus.BAD_REQUEST),

    FAMILY_NOT_FOUND(HttpStatus.NOT_FOUND),

    ALREADY_JOINED_FAMILY(HttpStatus.CONFLICT),
    OWNER_CANNOT_LEAVE(HttpStatus.CONFLICT),

    INVITE_CODE_CREATE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;
}
