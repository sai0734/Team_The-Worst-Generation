package com.backend.hospital.general.validation;

import com.backend.hospital.general.domain.GeneralHospitalReservation;
import com.backend.hospital.general.domain.GeneralHospitalReservationStatus;
import com.backend.hospital.general.dto.GeneralHospitalReservationDTO;
import com.backend.openclaw.message.utils.PhoneNumberUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class GeneralHospitalReservationValidator {

    public String validateRegister(GeneralHospitalReservationDTO reservationDTO) {
        if (reservationDTO.getMemberEmail() == null || reservationDTO.getMemberEmail().isBlank()) {
            throw new IllegalArgumentException("회원 정보가 필요합니다.");
        }

        if (reservationDTO.getHospitalId() == null || reservationDTO.getHospitalId().isBlank()) {
            throw new IllegalArgumentException("병원 ID가 필요합니다.");
        }

        if (reservationDTO.getHospitalName() == null || reservationDTO.getHospitalName().isBlank()) {
            throw new IllegalArgumentException("병원명이 필요합니다.");
        }

        if (reservationDTO.getReservationDate() == null) {
            throw new IllegalArgumentException("예약 날짜가 필요합니다.");
        }

        if (reservationDTO.getReservationTime() == null || reservationDTO.getReservationTime().isBlank()) {
            throw new IllegalArgumentException("예약 시간이 필요합니다.");
        }

        String notificationPhone =
                PhoneNumberUtils.normalize(reservationDTO.getNotificationPhone());

        if (notificationPhone == null || notificationPhone.isBlank()) {
            throw new IllegalArgumentException("문자 수신 번호가 필요합니다.");
        }

        if (!notificationPhone.matches("^01[016789][0-9]{7,8}$")) {
            throw new IllegalArgumentException("올바른 휴대전화 번호가 필요합니다.");
        }

        return notificationPhone;
    }

    public void validateCancel(
            GeneralHospitalReservation reservation,
            String memberEmail
    ) {
        if (!reservation.getMemberEmail().equals(memberEmail)) {
            throw new AccessDeniedException("본인 예약만 취소할 수 있습니다.");
        }

        if (reservation.getStatus() != GeneralHospitalReservationStatus.REQUESTED) {
            throw new IllegalStateException("이미 처리된 예약입니다.");
        }
    }
}
