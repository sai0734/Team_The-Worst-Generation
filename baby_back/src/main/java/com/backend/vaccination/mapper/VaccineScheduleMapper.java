package com.backend.vaccination.mapper;

import com.backend.vaccination.domain.VaccineSchedule;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface VaccineScheduleMapper {

    List<VaccineSchedule> selectList();

}