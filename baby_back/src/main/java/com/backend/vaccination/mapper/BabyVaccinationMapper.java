package com.backend.vaccination.mapper;

import com.backend.vaccination.domain.BabyVaccination;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabyVaccinationMapper {

    List<BabyVaccination> selectList(@Param("babyNo") Long babyNo, @Param("email") String email);

    BabyVaccination selectByVaccinationNo(@Param("vaccinationNo") Long vaccinationNo, @Param("email") String email);

    void insertScheduleList(@Param("babyNo") Long babyNo);

    void insertCustom(BabyVaccination babyVaccination);

    void updateComplete(@Param("vaccination") BabyVaccination babyVaccination, @Param("email") String email);

    void delete(@Param("vaccinationNo") Long vaccinationNo, @Param("email") String email);

    void deleteByBabyNo(@Param("babyNo") Long babyNo, @Param("email") String email);

}