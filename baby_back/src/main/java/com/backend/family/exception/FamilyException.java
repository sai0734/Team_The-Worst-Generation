package com.backend.family.exception;

import lombok.Getter;

@Getter
public class FamilyException extends RuntimeException {

    private final FamilyErrorCode errorCode;

    public FamilyException(FamilyErrorCode errorCode) {
        super(errorCode.name());
        this.errorCode = errorCode;
    }
}