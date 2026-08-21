package com.backend.hospital.general.service;

import com.backend.hospital.general.domain.GeneralHospitalReservation;
import com.backend.hospital.general.domain.GeneralHospitalReservationStatus;
import com.backend.hospital.general.dto.GeneralHospitalReservationDTO;
import com.backend.hospital.general.mapper.GeneralHospitalReservationMapper;
import com.backend.hospital.general.validation.GeneralHospitalReservationValidator;
import lombok.RequiredArgsConstructor;
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
    private final GeneralHospitalReservationValidator generalHospitalReservationValidator;
    private final GeneralHospitalReservationNoticeService generalHospitalReservationNoticeService;

    @Override
    public Long register(GeneralHospitalReservationDTO reservationDTO) {
        String notificationPhone =
                generalHospitalReservationValidator.validateRegister(reservationDTO);

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
        generalHospitalReservationNoticeService.notifyAfterCommit(reservation);

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

        generalHospitalReservationValidator.validateCancel(reservation, memberEmail);

        generalHospitalReservationMapper.updateStatus(
                reservationNo,
                GeneralHospitalReservationStatus.CANCELED
        );
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
