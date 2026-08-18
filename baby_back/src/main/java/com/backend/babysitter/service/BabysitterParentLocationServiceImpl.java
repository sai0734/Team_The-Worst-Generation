package com.backend.babysitter.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.babysitter.domain.BabysitterParentLocation;
import com.backend.babysitter.mapper.BabysitterParentLocationMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class BabysitterParentLocationServiceImpl implements BabysitterParentLocationService {

    private final BabysitterParentLocationMapper babysitterParentLocationMapper;

    @Override
    public BabysitterParentLocation get(String email) {

        return babysitterParentLocationMapper.selectByEmail(email);
    }

    @Override
    public void save(String email, String region, Double latitude, Double longitude) {

        BabysitterParentLocation location = babysitterParentLocationMapper.selectByEmail(email);

        BigDecimal lat = latitude != null ? BigDecimal.valueOf(latitude) : null;
        BigDecimal lng = longitude != null ? BigDecimal.valueOf(longitude) : null;

        if (location == null) {
            babysitterParentLocationMapper.insert(
                BabysitterParentLocation.builder()
                    .email(email)
                    .region(region)
                    .latitude(lat)
                    .longitude(lng)
                    .build()
            );
            return;
        }

        location.changeRegion(region, lat, lng);

        babysitterParentLocationMapper.update(location);
    }
}
