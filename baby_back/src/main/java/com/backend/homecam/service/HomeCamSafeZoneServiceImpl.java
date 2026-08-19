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
            return;
        }

        zone.changeZone(dto.getXRatio(), dto.getYRatio(), dto.getWRatio(), dto.getHRatio());
        homeCamSafeZoneMapper.update(zone);
    }
}
