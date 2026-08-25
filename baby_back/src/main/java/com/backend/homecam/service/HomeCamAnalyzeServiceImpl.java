package com.backend.homecam.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.global.ai.HomeCamAiClient;
import com.backend.homecam.domain.HomeCamSafeZone;
import com.backend.homecam.dto.HomeCamAnalyzeResultDTO;
import com.backend.homecam.mapper.HomeCamSafeZoneMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class HomeCamAnalyzeServiceImpl implements HomeCamAnalyzeService {

    private final HomeCamSafeZoneMapper homeCamSafeZoneMapper;

    private final HomeCamAiClient homeCamAiClient;

    @Override
    public HomeCamAnalyzeResultDTO analyze(String email, String imageBase64) {

        HomeCamSafeZone zone = homeCamSafeZoneMapper.selectByEmail(email);

        if (zone == null) {
            return HomeCamAnalyzeResultDTO.builder()
                    .ready(false)
                    .build();
        }

        HomeCamAiClient.DetectResult result = homeCamAiClient.detectPeople(imageBase64);

        boolean outOfZone = result.people.stream()
                .noneMatch(person -> isCenterInZone(person, zone));

        return HomeCamAnalyzeResultDTO.builder()
                .ready(true)
                .outOfZone(outOfZone)
                .build();
    }

    // 탐지된 사람 박스의 중심점이 저장된 안전영역 사각형 안에 있는지 확인
    private boolean isCenterInZone(HomeCamAiClient.DetectedPerson person, HomeCamSafeZone zone) {

        double centerX = person.xRatio + person.wRatio / 2;
        double centerY = person.yRatio + person.hRatio / 2;

        double zoneX = zone.getXRatio().doubleValue();
        double zoneY = zone.getYRatio().doubleValue();
        double zoneW = zone.getWRatio().doubleValue();
        double zoneH = zone.getHRatio().doubleValue();

        return centerX >= zoneX && centerX <= zoneX + zoneW
                && centerY >= zoneY && centerY <= zoneY + zoneH;
    }
}
