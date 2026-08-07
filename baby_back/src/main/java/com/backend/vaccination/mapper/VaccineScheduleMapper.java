package com.backend.vaccination.mapper;

import com.backend.vaccination.domain.VaccineSchedule;

import java.util.List;

public interface VaccineScheduleMapper {

    List<VaccineSchedule> selectList();

}