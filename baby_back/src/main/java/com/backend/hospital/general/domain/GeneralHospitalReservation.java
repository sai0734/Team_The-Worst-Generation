package com.backend.hospital.general.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GeneralHospitalReservation {

    private Long reservationNo;

    private String memberEmail;

    private String hospitalId;
    private String hospitalName;
    private String hospitalType;
    private String hospitalAddress;
    private String hospitalPhone;

    // 예약 결과 문자를 받을 보호자 번호
    private String notificationPhone;

    private LocalDate reservationDate;
    private String reservationTime;

    private String patientName;
    private String message;

    @Builder.Default
    private GeneralHospitalReservationStatus status = GeneralHospitalReservationStatus.REQUESTED;

    private LocalDateTime regTime;
    private LocalDateTime modTime;
}
