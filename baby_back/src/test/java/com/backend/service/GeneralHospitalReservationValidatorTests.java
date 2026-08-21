package com.backend.service;

import com.backend.hospital.general.domain.GeneralHospitalReservation;
import com.backend.hospital.general.domain.GeneralHospitalReservationStatus;
import com.backend.hospital.general.dto.GeneralHospitalReservationDTO;
import com.backend.hospital.general.validation.GeneralHospitalReservationValidator;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Log4j2
class GeneralHospitalReservationValidatorTests {

    private GeneralHospitalReservationValidator validator;

    @BeforeEach
    void setUp() {
        validator = new GeneralHospitalReservationValidator();
    }

    @Test
    void normalizeRegisterPhone() {
        String phone = validator.validateRegister(createRequest("010-1234-5678"));

        log.info("Normalized phone={}", phone);

        assertEquals("01012345678", phone);
    }

    @Test
    void rejectInvalidRegisterPhone() {
        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> validator.validateRegister(createRequest("1234"))
                );

        log.info("Invalid phone rejected: {}", exception.getMessage());

        assertEquals("올바른 휴대전화 번호가 필요합니다.", exception.getMessage());
    }

    @Test
    void rejectCancelByOtherMember() {
        GeneralHospitalReservation reservation =
                GeneralHospitalReservation.builder()
                        .memberEmail("user@example.com")
                        .status(GeneralHospitalReservationStatus.REQUESTED)
                        .build();

        AccessDeniedException exception =
                assertThrows(
                        AccessDeniedException.class,
                        () -> validator.validateCancel(reservation, "other@example.com")
                );

        log.info("Cancel rejected: {}", exception.getMessage());

        assertEquals("본인 예약만 취소할 수 있습니다.", exception.getMessage());
    }

    private GeneralHospitalReservationDTO createRequest(String notificationPhone) {
        return GeneralHospitalReservationDTO.builder()
                .memberEmail("user@example.com")
                .hospitalId("HOSP-001")
                .hospitalName("아이봄소아과")
                .notificationPhone(notificationPhone)
                .reservationDate(LocalDate.of(2026, 8, 20))
                .reservationTime("15:00")
                .patientName("아이봄")
                .build();
    }
}
