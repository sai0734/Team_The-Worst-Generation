package com.backend.babysitter.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.babysitter.domain.BabysitterAvailability;
import com.backend.babysitter.domain.BabysitterGrade;
import com.backend.babysitter.domain.BabysitterProfile;
import com.backend.babysitter.dto.BabysitterAvailabilityDTO;
import com.backend.babysitter.dto.BabysitterProfileDTO;
import com.backend.babysitter.dto.BabysitterSearchDTO;
import com.backend.babysitter.mapper.BabysitterPickMapper;
import com.backend.babysitter.mapper.BabysitterProfileMapper;
import com.backend.global.dto.PageResponseDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class BabysitterProfileServiceImpl implements BabysitterProfileService {

    private final BabysitterProfileMapper babysitterProfileMapper;

    private final BabysitterPickMapper babysitterPickMapper;

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
        } else {

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

        babysitterProfileMapper.deleteAvailability(profileDTO.getEmail());

        for (BabysitterAvailabilityDTO slot : profileDTO.getAvailability()) {
            babysitterProfileMapper.insertAvailability(
                BabysitterAvailability.builder()
                    .email(profileDTO.getEmail())
                    .dayOfWeek(slot.getDayOfWeek())
                    .timeSlot(slot.getTimeSlot())
                    .build()
            );
        }
    }

    @Override
    public void remove(String email) {

        Optional.ofNullable(babysitterProfileMapper.selectByEmail(email))
            .orElseThrow(() -> new NoSuchElementException("등록된 시터 프로필이 없습니다."));

        babysitterProfileMapper.deleteAvailability(email);
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

        List<BabysitterAvailabilityDTO> availability = profile.getAvailabilityList()
            .stream()
            .map(slot -> BabysitterAvailabilityDTO.builder()
                .dayOfWeek(slot.getDayOfWeek())
                .timeSlot(slot.getTimeSlot())
                .build())
            .collect(Collectors.toList());

        long pickCount = babysitterPickMapper.countBySitter(profile.getEmail());

        return BabysitterProfileDTO.builder()
            .email(profile.getEmail())
            .name(profile.getName())
            .careerYears(profile.getCareerYears())
            .region(profile.getRegion())
            .availableTime(profile.getAvailableTime())
            .hourlyRate(profile.getHourlyRate())
            .intro(profile.getIntro())
            .status(profile.getStatus())
            .availability(availability)
            .pickCount(pickCount)
            .grade(BabysitterGrade.fromPickCount(pickCount))
            .regTime(profile.getRegTime())
            .modTime(profile.getModTime())
            .build();
    }
}
