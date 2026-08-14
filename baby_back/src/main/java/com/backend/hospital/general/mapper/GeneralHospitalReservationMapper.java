package com.backend.hospital.general.mapper;

import com.backend.hospital.general.domain.GeneralHospitalReservation;
import com.backend.hospital.general.domain.GeneralHospitalReservationStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GeneralHospitalReservationMapper {

    GeneralHospitalReservation selectByReservationNo(@Param("reservationNo") Long reservationNo);

    List<GeneralHospitalReservation> selectListByMember(@Param("memberEmail") String memberEmail);

    void insert(GeneralHospitalReservation reservation);

    void updateStatus(
            @Param("reservationNo") Long reservationNo,
            @Param("status") GeneralHospitalReservationStatus status
    );
}
