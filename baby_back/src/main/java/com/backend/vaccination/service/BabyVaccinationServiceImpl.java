package com.backend.vaccination.service;

import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.vaccination.domain.BabyVaccination;
import com.backend.vaccination.dto.BabyVaccinationDTO;
import com.backend.vaccination.dto.VaccinationProgressDTO;
import com.backend.vaccination.mapper.BabyVaccinationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class BabyVaccinationServiceImpl implements BabyVaccinationService {

    private final BabyVaccinationMapper babyVaccinationMapper;

    private final BabyInfoMapper babyInfoMapper;

    private final ModelMapper modelMapper;

    @Override
    public List<BabyVaccinationDTO> getList(Long babyNo, String email) {

        log.info("babyVaccination_Service_getList_실행~~~~~~~~~~~~");

        List<BabyVaccination> result = babyVaccinationMapper.selectList(babyNo, email);

        return result.stream()
                .map(v -> modelMapper.map(v, BabyVaccinationDTO.class))
                .collect(Collectors.toList());

    }

    @Override
    public void initSchedule(Long babyNo, String email) {

        log.info("babyVaccination_Service_initSchedule_실행~~~~~~~~~~~~");

        if (babyInfoMapper.selectByBabyNo(babyNo, email) == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyNo);
        }

        babyVaccinationMapper.insertScheduleList(babyNo);

    }

    @Override
    public void completeCheck(BabyVaccinationDTO babyVaccinationDTO, String email) {

        log.info("babyVaccination_Service_completeCheck_실행~~~~~~~~~~~~");

        BabyVaccination babyVaccination = babyVaccinationMapper.selectByVaccinationNo(babyVaccinationDTO.getVaccinationNo(), email);

        if (babyVaccination == null) {
            throw new IllegalArgumentException("존재하지 않는 접종 기록입니다: " + babyVaccinationDTO.getVaccinationNo());
        }

        babyVaccination.changeCompleted(babyVaccinationDTO.getCompleted());
        babyVaccination.changeCompletedDate(babyVaccinationDTO.getCompletedDate());
        babyVaccination.changeHospitalName(babyVaccinationDTO.getHospitalName());

        babyVaccinationMapper.updateComplete(babyVaccination, email);

    }

    @Override
    public Long registerCustom(BabyVaccinationDTO babyVaccinationDTO, String email) {

        log.info("babyVaccination_Service_registerCustom_실행~~~~~~~~~~~~");

        if (babyInfoMapper.selectByBabyNo(babyVaccinationDTO.getBabyNo(), email) == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyVaccinationDTO.getBabyNo());
        }

        BabyVaccination babyVaccination = modelMapper.map(babyVaccinationDTO, BabyVaccination.class);

        babyVaccinationMapper.insertCustom(babyVaccination);

        return babyVaccination.getVaccinationNo();

    }

    @Override
    public void remove(Long vaccinationNo, String email) {

        log.info("babyVaccination_Service_remove_실행~~~~~~~~~~~~");

        BabyVaccination babyVaccination = babyVaccinationMapper.selectByVaccinationNo(vaccinationNo, email);

        if (babyVaccination == null) {
            throw new IllegalArgumentException("존재하지 않는 접종 기록입니다: " + vaccinationNo);
        }

        if (!babyVaccination.getIsCustom()) {
            throw new IllegalArgumentException("표준 접종 항목은 삭제할 수 없습니다.");
        }

        babyVaccinationMapper.delete(vaccinationNo, email);

    }

    @Override
    public VaccinationProgressDTO getProgress(Long babyNo, String email) {

        log.info("babyVaccination_Service_getProgress_실행~~~~~~~~~~~~");


        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(babyNo, email);

        if (babyInfo == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyNo);
        }

        List<BabyVaccination> list = babyVaccinationMapper.selectList(babyNo, email);

        int totalCount = list.size();
        int completedCount = (int) list.stream()
                .filter(BabyVaccination::getCompleted)
                .count();

        BabyVaccination next = list.stream()
                .filter(v -> !v.getCompleted())
                .filter(v -> v.getRecommendedMonth() != null)
                .min(Comparator.comparing(BabyVaccination::getRecommendedMonth))
                .orElse(null);

        Integer dDay = null;
        String nextVaccineName = null;

        if (next != null) {
            LocalDate targetDate = babyInfo.getBirthDate().plusMonths(next.getRecommendedMonth());
            dDay = (int) ChronoUnit.DAYS.between(LocalDate.now(), targetDate);
            nextVaccineName = next.getVaccineName();
        }

        VaccinationProgressDTO vaccinationProgressDTO = VaccinationProgressDTO.builder()
                .totalCount(totalCount)
                .completedCount(completedCount)
                .dDay(dDay)
                .nextVaccineName(nextVaccineName)
                .build();

        return vaccinationProgressDTO;

    }

}