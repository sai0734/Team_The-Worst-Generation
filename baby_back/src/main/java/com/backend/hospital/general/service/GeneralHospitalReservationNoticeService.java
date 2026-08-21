package com.backend.hospital.general.service;

import com.backend.hospital.general.domain.GeneralHospitalReservation;

public interface GeneralHospitalReservationNoticeService {

    void notifyAfterCommit(GeneralHospitalReservation reservation);
}
