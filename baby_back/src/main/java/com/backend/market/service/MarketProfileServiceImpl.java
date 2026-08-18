package com.backend.market.service;

import com.backend.market.domain.MarketProfile;
import com.backend.market.dto.MarketProfileDTO;
import com.backend.market.mapper.MarketProfileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class MarketProfileServiceImpl implements MarketProfileService{

    private final MarketProfileMapper marketProfileMapper;

    private final ModelMapper modelMapper;

    @Override
    public MarketProfileDTO get(String email) {

        MarketProfile profile = marketProfileMapper.selectByEmail(email);

        if (profile == null) {
            profile = MarketProfile.builder().email(email).build();
            marketProfileMapper.insert(profile);
        }

        return modelMapper.map(profile, MarketProfileDTO.class);
    }

    @Override
    public void modify(MarketProfileDTO dto) {

        MarketProfile profile = marketProfileMapper.selectByEmail(dto.getEmail());

        if (profile == null) {
            profile = MarketProfile.builder().email(dto.getEmail()).build();
            marketProfileMapper.insert(profile);
        }

        profile.changeLocation(dto.getLocationName(), dto.getLatitude(), dto.getLongitude());

        marketProfileMapper.update(profile);
    }

    @Override
    public void verifyLocation(String email) {

        MarketProfile profile = marketProfileMapper.selectByEmail(email);

        if (profile == null) {
            profile = MarketProfile.builder().email(email).build();
            marketProfileMapper.insert(profile);
        }

        profile.verifyLocation();

        marketProfileMapper.update(profile);
    }

    @Override
    public void changeNickname(String email, String nickname) {

        MarketProfile profile = marketProfileMapper.selectByEmail(email);

        if (profile == null) {
            profile = MarketProfile.builder().email(email).build();
            marketProfileMapper.insert(profile);
        }

        profile.changeNickname(nickname);

        marketProfileMapper.update(profile);
    }
}
