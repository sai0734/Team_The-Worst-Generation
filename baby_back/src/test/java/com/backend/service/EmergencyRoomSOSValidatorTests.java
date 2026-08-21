package com.backend.service;

import com.backend.hospital.emergency.validation.EmergencyRoomSOSValidator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EmergencyRoomSOSValidatorTests {

    private final EmergencyRoomSOSValidator validator = new EmergencyRoomSOSValidator();

    @Test
    void normalizeNotificationPhone() {
        assertEquals("01012345678", validator.validateNotificationPhone("010-1234-5678"));
    }

    @Test
    void rejectInvalidNotificationPhone() {
        assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateNotificationPhone("02-3410-2114")
        );
    }

    @Test
    void rejectBlankRequester() {
        assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateRequester(" ")
        );
    }
}
