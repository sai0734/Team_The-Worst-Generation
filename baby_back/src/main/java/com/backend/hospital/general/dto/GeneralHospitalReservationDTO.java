package com.backend.hospital.general.dto;

import com.backend.hospital.general.domain.GeneralHospitalReservationStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GeneralHospitalReservationDTO {

    private Long reservationNo;

    private String memberEmail;

    private String hospitalId;
    private String hospitalName;
    private String hospitalType;
    private String hospitalAddress;
    private String hospitalPhone;

    // 예약 결과 문자를 받을 보호자 번호
    private String notificationPhone;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate reservationDate;

    private String reservationTime;

    private String patientName;
    private String message;

    private GeneralHospitalReservationStatus status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime regTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime modTime;
}
