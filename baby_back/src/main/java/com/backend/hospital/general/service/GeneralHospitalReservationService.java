package com.backend.hospital.general.service;

import com.backend.hospital.general.dto.GeneralHospitalReservationDTO;

import java.util.List;

public interface GeneralHospitalReservationService {

    Long register(GeneralHospitalReservationDTO reservationDTO);

    List<GeneralHospitalReservationDTO> listMine(String memberEmail);

    void cancel(Long reservationNo, String memberEmail);
}
