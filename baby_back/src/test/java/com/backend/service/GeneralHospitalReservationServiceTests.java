package com.backend.service;

import com.backend.hospital.general.domain.GeneralHospitalReservation;
import com.backend.hospital.general.domain.GeneralHospitalReservationStatus;
import com.backend.hospital.general.dto.GeneralHospitalReservationDTO;
import com.backend.hospital.general.mapper.GeneralHospitalReservationMapper;
import com.backend.hospital.general.service.GeneralHospitalReservationService;
import com.backend.hospital.general.service.GeneralHospitalReservationServiceImpl;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Log4j2
class GeneralHospitalReservationServiceTests {

    private GeneralHospitalReservationMapper mapper;
    private GeneralHospitalReservationService service;

    @BeforeEach
    void setUp() {
        mapper = mock(GeneralHospitalReservationMapper.class);
        service = new GeneralHospitalReservationServiceImpl(mapper);
    }

    @Test
    void registerReservationWithNormalizedPhone() {
        GeneralHospitalReservationDTO request =
                createRequest("010-1234-5678");

        service.register(request);

        ArgumentCaptor<GeneralHospitalReservation> captor =
                ArgumentCaptor.forClass(
                        GeneralHospitalReservation.class
                );

        verify(mapper).insert(captor.capture());

        GeneralHospitalReservation saved = captor.getValue();

        log.info(
                "Reservation saved: phone={}, status={}",
                saved.getNotificationPhone(),
                saved.getStatus()
        );

        assertEquals(
                "01012345678",
                saved.getNotificationPhone()
        );

        assertEquals(
                GeneralHospitalReservationStatus.REQUESTED,
                saved.getStatus()
        );
    }

    @Test
    void rejectReservationWithInvalidPhone() {
        GeneralHospitalReservationDTO request =
                createRequest("1234");

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> service.register(request)
                );

        log.info(
                "Invalid phone rejected: {}",
                exception.getMessage()
        );

        assertEquals(
                "올바른 휴대전화 번호가 필요합니다.",
                exception.getMessage()
        );

        verifyNoInteractions(mapper);
    }

    @Test
    void returnNotificationPhoneFromReservationList() {
        GeneralHospitalReservation reservation =
                GeneralHospitalReservation.builder()
                        .reservationNo(1L)
                        .memberEmail("user@example.com")
                        .hospitalId("HOSP-001")
                        .hospitalName("아이봄소아과")
                        .notificationPhone("01012345678")
                        .reservationDate(
                                LocalDate.of(2026, 8, 20)
                        )
                        .reservationTime("15:00")
                        .status(
                                GeneralHospitalReservationStatus.REQUESTED
                        )
                        .build();

        when(
                mapper.selectListByMember("user@example.com")
        ).thenReturn(List.of(reservation));

        List<GeneralHospitalReservationDTO> result =
                service.listMine("user@example.com");

        log.info(
                "Reservation list phone={}",
                result.get(0).getNotificationPhone()
        );

        assertEquals(1, result.size());
        assertEquals(
                "01012345678",
                result.get(0).getNotificationPhone()
        );
    }

    private GeneralHospitalReservationDTO createRequest(
            String notificationPhone
    ) {
        return GeneralHospitalReservationDTO.builder()
                .memberEmail("user@example.com")
                .hospitalId("HOSP-001")
                .hospitalName("아이봄소아과")
                .hospitalType("소아청소년과")
                .hospitalAddress("서울특별시 강남구")
                .hospitalPhone("02-1234-5678")
                .notificationPhone(notificationPhone)
                .reservationDate(
                        LocalDate.of(2026, 8, 20)
                )
                .reservationTime("15:00")
                .patientName("아이봄")
                .message("발열 증상이 있습니다.")
                .build();
    }
}