package com.backend.babyInfo.service;

import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.domain.GrowthPercentile;
import com.backend.babyInfo.dto.GrowthPercentileDTO;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.babyInfo.mapper.GrowthPercentileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class GrowthPercentileServiceImpl implements GrowthPercentileService {

    private final BabyInfoMapper babyInfoMapper;

    private final GrowthPercentileMapper growthPercentileMapper;

    private final ModelMapper modelMapper;

    @Override
    public GrowthPercentileDTO getPercentile(Long babyNo, String email) {

        log.info("growthPercentile_Service_getPercentile_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(babyNo, email);

        if (babyInfo == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyNo);
        }

        LocalDate birthDate = babyInfo.getBirthDate();
        LocalDate today = LocalDate.now();

        // 현재 개월수 (연도 차이) * 12 + (월 차이)
        int ageMonth = (today.getYear() - birthDate.getYear()) * 12 + (today.getMonthValue() - birthDate.getMonthValue());

        // 데이터가 36개월 분이라 제한을 걸어둔
        int roundedMonth = Math.max(0, Math.min(36, Math.round(ageMonth / 3.0f)*3));

        GrowthPercentile percentile = growthPercentileMapper.selectByAgeAndGender(roundedMonth, babyInfo.getGender());

        if (percentile == null) {
            throw new IllegalArgumentException("해당 개월수의 평균 데이터가 없습니다: " + roundedMonth);
        }

        GrowthPercentileDTO growthPercentileDTO = modelMapper.map(percentile, GrowthPercentileDTO.class);

        return growthPercentileDTO;

    }

}