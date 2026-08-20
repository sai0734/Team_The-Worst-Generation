package com.backend.hospital.general.service;

import com.backend.hospital.general.domain.GeneralHospitalReservation;
import com.backend.hospital.general.domain.GeneralHospitalReservationStatus;
import com.backend.hospital.general.dto.GeneralHospitalReservationDTO;
import com.backend.hospital.general.mapper.GeneralHospitalReservationMapper;
import com.backend.openclaw.message.utils.PhoneNumberUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class GeneralHospitalReservationServiceImpl implements GeneralHospitalReservationService {

    private final GeneralHospitalReservationMapper generalHospitalReservationMapper;

    @Override
    public Long register(GeneralHospitalReservationDTO reservationDTO) {
        validateReservationRequest(reservationDTO);

        String notificationPhone = PhoneNumberUtils.normalize(reservationDTO.getNotificationPhone());

        GeneralHospitalReservation reservation = GeneralHospitalReservation.builder()
                .memberEmail(reservationDTO.getMemberEmail())
                .hospitalId(reservationDTO.getHospitalId())
                .hospitalName(reservationDTO.getHospitalName())
                .hospitalType(reservationDTO.getHospitalType())
                .hospitalAddress(reservationDTO.getHospitalAddress())
                .hospitalPhone(reservationDTO.getHospitalPhone())
                .notificationPhone(notificationPhone)
                .reservationDate(reservationDTO.getReservationDate())
                .reservationTime(reservationDTO.getReservationTime())
                .patientName(reservationDTO.getPatientName())
                .message(reservationDTO.getMessage())
                .status(GeneralHospitalReservationStatus.REQUESTED)
                .build();

        generalHospitalReservationMapper.insert(reservation);

        return reservation.getReservationNo();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GeneralHospitalReservationDTO> listMine(String memberEmail) {
        return generalHospitalReservationMapper.selectListByMember(memberEmail)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Override
    public void cancel(Long reservationNo, String memberEmail) {
        GeneralHospitalReservation reservation = Optional
                .ofNullable(generalHospitalReservationMapper.selectByReservationNo(reservationNo))
                .orElseThrow(() -> new NoSuchElementException("존재하지 않는 예약입니다."));

        if (!reservation.getMemberEmail().equals(memberEmail)) {
            throw new AccessDeniedException("본인 예약만 취소할 수 있습니다.");
        }

        if (reservation.getStatus() != GeneralHospitalReservationStatus.REQUESTED) {
            throw new IllegalStateException("이미 처리된 예약입니다.");
        }

        generalHospitalReservationMapper.updateStatus(
                reservationNo,
                GeneralHospitalReservationStatus.CANCELED
        );
    }

    private void validateReservationRequest(GeneralHospitalReservationDTO reservationDTO) {
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
                PhoneNumberUtils.normalize(
                        reservationDTO.getNotificationPhone()
                );

        if (notificationPhone == null
                || notificationPhone.isBlank()) {
            throw new IllegalArgumentException(
                    "문자 수신 번호가 필요합니다."
            );
        }

        if (!notificationPhone.matches(
                "^01[016789][0-9]{7,8}$"
        )) {
            throw new IllegalArgumentException(
                    "올바른 휴대전화 번호가 필요합니다."
            );
        }
    }

    private GeneralHospitalReservationDTO toDTO(GeneralHospitalReservation reservation) {
        return GeneralHospitalReservationDTO.builder()
                .reservationNo(reservation.getReservationNo())
                .memberEmail(reservation.getMemberEmail())
                .hospitalId(reservation.getHospitalId())
                .hospitalName(reservation.getHospitalName())
                .hospitalType(reservation.getHospitalType())
                .hospitalAddress(reservation.getHospitalAddress())
                .hospitalPhone(reservation.getHospitalPhone())
                .notificationPhone(reservation.getNotificationPhone())
                .reservationDate(reservation.getReservationDate())
                .reservationTime(reservation.getReservationTime())
                .patientName(reservation.getPatientName())
                .message(reservation.getMessage())
                .status(reservation.getStatus())
                .regTime(reservation.getRegTime())
                .modTime(reservation.getModTime())
                .build();
    }
}
