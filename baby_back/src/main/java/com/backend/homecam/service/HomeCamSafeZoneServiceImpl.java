package com.backend.homecam.service;

import com.backend.homecam.domain.HomeCamSafeZone;
import com.backend.homecam.dto.HomeCamSafeZoneDTO;
import com.backend.homecam.mapper.HomeCamSafeZoneMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class HomeCamSafeZoneServiceImpl implements HomeCamSafeZoneService {

    private final HomeCamSafeZoneMapper homeCamSafeZoneMapper;

    private final ModelMapper modelMapper;

    private final HomeCamAnalyzeService homeCamAnalyzeService;

    @Override
    public HomeCamSafeZoneDTO get(String email) {

        HomeCamSafeZone zone = homeCamSafeZoneMapper.selectByEmail(email);

        if (zone == null) {
            return null;
        }

        return modelMapper.map(zone, HomeCamSafeZoneDTO.class);
    }

    @Override
    public void save(HomeCamSafeZoneDTO dto) {

        HomeCamSafeZone zone = homeCamSafeZoneMapper.selectByEmail(dto.getEmail());

        if (zone == null) {
            zone = HomeCamSafeZone.builder().email(dto.getEmail()).build();
            zone.changeZone(dto.getXRatio(), dto.getYRatio(), dto.getWRatio(), dto.getHRatio());
            homeCamSafeZoneMapper.insert(zone);
        } else {
            zone.changeZone(dto.getXRatio(), dto.getYRatio(), dto.getWRatio(), dto.getHRatio());
            homeCamSafeZoneMapper.update(zone);
        }

        if (dto.getBaselineImageBase64() != null && !dto.getBaselineImageBase64().isBlank()) {
            try {
                homeCamAnalyzeService.captureBaseline(dto.getEmail(), dto.getBaselineImageBase64());
            } catch (Exception e) {
                // AI서버가 잠깐 꺼져있어도 안전영역(사각형) 저장 자체는 실패시키지 않음 -
                // 기준 이미지가 없으면 analyze()가 ready=false를 돌려줄 뿐, 다음 저장 때 다시 시도됨
                log.warn("홈캠 기준 임베딩 캡처 실패 (email=" + dto.getEmail() + "): " + e.getMessage());
            }
        }
    }
}
