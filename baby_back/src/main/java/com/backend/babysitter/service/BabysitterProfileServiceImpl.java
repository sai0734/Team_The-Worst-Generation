package com.backend.babysitter.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.babysitter.domain.BabysitterProfile;
import com.backend.babysitter.dto.BabysitterProfileDTO;
import com.backend.babysitter.dto.BabysitterSearchDTO;
import com.backend.babysitter.mapper.BabysitterProfileMapper;
import com.backend.dto.PageResponseDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class BabysitterProfileServiceImpl implements BabysitterProfileService {

    private final BabysitterProfileMapper babysitterProfileMapper;

    @Override
    public BabysitterProfileDTO get(String email) {

        BabysitterProfile profile = Optional.ofNullable(babysitterProfileMapper.selectByEmail(email))
            .orElseThrow(() -> new NoSuchElementException("등록된 시터 프로필이 없습니다."));

        return toDTO(profile);
    }

    @Override
    public void modify(BabysitterProfileDTO profileDTO) {

        BabysitterProfile profile = babysitterProfileMapper.selectByEmail(profileDTO.getEmail());

        if (profile == null) {
            profile = BabysitterProfile.builder()
                .email(profileDTO.getEmail())
                .name(profileDTO.getName())
                .careerYears(profileDTO.getCareerYears())
                .region(profileDTO.getRegion())
                .availableTime(profileDTO.getAvailableTime())
                .hourlyRate(profileDTO.getHourlyRate())
                .intro(profileDTO.getIntro())
                .build();

            babysitterProfileMapper.insert(profile);

            return;
        }

        profile.changeProfile(
            profileDTO.getName(),
            profileDTO.getCareerYears(),
            profileDTO.getRegion(),
            profileDTO.getAvailableTime(),
            profileDTO.getHourlyRate(),
            profileDTO.getIntro()
        );

        babysitterProfileMapper.update(profile);
    }

    @Override
    public void remove(String email) {

        Optional.ofNullable(babysitterProfileMapper.selectByEmail(email))
            .orElseThrow(() -> new NoSuchElementException("등록된 시터 프로필이 없습니다."));

        babysitterProfileMapper.delete(email);
    }

    @Override
    public PageResponseDTO<BabysitterProfileDTO> getList(BabysitterSearchDTO searchDTO) {

        int skip = (searchDTO.getPage() - 1) * searchDTO.getSize();

        List<BabysitterProfileDTO> dtoList = babysitterProfileMapper.selectList(searchDTO, skip)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());

        long totalCount = babysitterProfileMapper.selectListCount(searchDTO);

        return PageResponseDTO.<BabysitterProfileDTO>withAll()
            .dtoList(dtoList)
            .totalCount(totalCount)
            .pageRequestDTO(searchDTO)
            .build();
    }

    private BabysitterProfileDTO toDTO(BabysitterProfile profile) {

        return BabysitterProfileDTO.builder()
            .email(profile.getEmail())
            .name(profile.getName())
            .careerYears(profile.getCareerYears())
            .region(profile.getRegion())
            .availableTime(profile.getAvailableTime())
            .hourlyRate(profile.getHourlyRate())
            .intro(profile.getIntro())
            .status(profile.getStatus())
            .regTime(profile.getRegTime())
            .modTime(profile.getModTime())
            .build();
    }
}
