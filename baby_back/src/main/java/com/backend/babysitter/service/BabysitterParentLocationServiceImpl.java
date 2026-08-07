package com.backend.babysitter.service;

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
    public String getRegion(String email) {

        BabysitterParentLocation location = babysitterParentLocationMapper.selectByEmail(email);

        return location != null ? location.getRegion() : null;
    }

    @Override
    public void saveRegion(String email, String region) {

        BabysitterParentLocation location = babysitterParentLocationMapper.selectByEmail(email);

        if (location == null) {
            babysitterParentLocationMapper.insert(
                BabysitterParentLocation.builder()
                    .email(email)
                    .region(region)
                    .build()
            );
            return;
        }

        location.changeRegion(region);

        babysitterParentLocationMapper.update(location);
    }
}
