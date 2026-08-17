package com.backend.babysitter.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.backend.babysitter.domain.BabysitterAvailability;
import com.backend.babysitter.domain.BabysitterGradeCalculator;
import com.backend.babysitter.domain.BabysitterProfile;
import com.backend.babysitter.dto.BabysitterAvailabilityDTO;
import com.backend.babysitter.dto.BabysitterProfileDTO;
import com.backend.babysitter.dto.BabysitterSearchDTO;
import com.backend.babysitter.mapper.BabysitterPickMapper;
import com.backend.babysitter.mapper.BabysitterProfileMapper;
import com.backend.babysitter.mapper.BabysitterRequestMapper;
import com.backend.babysitter.mapper.BabysitterReviewMapper;
import com.backend.global.dto.PageResponseDTO;
import com.backend.global.util.CustomFileUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class BabysitterProfileServiceImpl implements BabysitterProfileService {

    // 하버사인 공식에서 각도 비율을 실제 km 거리로 환산할 때 곱하는 지구 반지름
    private static final int EARTH_RADIUS_KM = 6371;

    private final BabysitterProfileMapper babysitterProfileMapper;

    private final BabysitterPickMapper babysitterPickMapper;

    private final BabysitterRequestMapper babysitterRequestMapper;

    private final BabysitterReviewMapper babysitterReviewMapper;

    private final CustomFileUtil fileUtil;

    @Override
    public BabysitterProfileDTO get(String email) {

        BabysitterProfile profile = Optional.ofNullable(babysitterProfileMapper.selectByEmail(email))
            .orElseThrow(() -> new NoSuchElementException("등록된 시터 프로필이 없습니다."));

        return toDTO(profile);
    }

    @Override
    public void modify(BabysitterProfileDTO profileDTO) {

        BabysitterProfile profile = babysitterProfileMapper.selectByEmail(profileDTO.getEmail());

        BigDecimal latitude = profileDTO.getLatitude() != null ? BigDecimal.valueOf(profileDTO.getLatitude()) : null;
        BigDecimal longitude = profileDTO.getLongitude() != null ? BigDecimal.valueOf(profileDTO.getLongitude()) : null;

        if (profile == null) {
            profile = BabysitterProfile.builder()
                .email(profileDTO.getEmail())
                .name(profileDTO.getName())
                .careerYears(profileDTO.getCareerYears())
                .region(profileDTO.getRegion())
                .latitude(latitude)
                .longitude(longitude)
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
                latitude,
                longitude,
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

    @Override
    public List<BabysitterProfileDTO> getNearby(double lat, double lng, double radiusKm) {

        List<BabysitterProfile> candidates = babysitterProfileMapper.selectNearbyCandidates();

        return candidates.stream()
            .map(profile -> {
                double distanceKm = haversineKm(
                    lat, lng,
                    profile.getLatitude().doubleValue(),
                    profile.getLongitude().doubleValue()
                );
                BabysitterProfileDTO dto = toDTO(profile);
                dto.setDistanceKm(distanceKm);
                return dto;
            })
            .filter(dto -> dto.getDistanceKm() <= radiusKm)
            .sorted(Comparator.comparingDouble(BabysitterProfileDTO::getDistanceKm))
            .collect(Collectors.toList());
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    @Override
    public List<BabysitterProfileDTO> getMyPicks(String email) {

        return babysitterPickMapper.selectSitterEmailsByPicker(email)
            .stream()
            .map(babysitterProfileMapper::selectByEmail)
            .filter(Objects::nonNull)
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    public String changeProfileImage(String email, MultipartFile file) {

        BabysitterProfile profile = Optional.ofNullable(babysitterProfileMapper.selectByEmail(email))
            .orElseThrow(() -> new NoSuchElementException("등록된 시터 프로필이 없습니다."));

        String oldFileName = profile.getProfileImageFileName();

        List<String> savedNames = fileUtil.saveFiles(List.of(file));
        String newFileName = savedNames.get(0);

        babysitterProfileMapper.updateProfileImage(email, newFileName);

        if (oldFileName != null) {
            fileUtil.deleteFiles(List.of(oldFileName));
        }

        return newFileName;
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
        long selectionCount = babysitterRequestMapper.countAcceptedBySitter(profile.getEmail());

        Double averageRating = babysitterReviewMapper.selectAverageRatingBySitter(profile.getEmail());
        long reviewCount = babysitterReviewMapper.countBySitter(profile.getEmail());

        return BabysitterProfileDTO.builder()
            .email(profile.getEmail())
            .name(profile.getName())
            .careerYears(profile.getCareerYears())
            .region(profile.getRegion())
            .latitude(profile.getLatitude() != null ? profile.getLatitude().doubleValue() : null)
            .longitude(profile.getLongitude() != null ? profile.getLongitude().doubleValue() : null)
            .availableTime(profile.getAvailableTime())
            .hourlyRate(profile.getHourlyRate())
            .intro(profile.getIntro())
            .profileImageFileName(profile.getProfileImageFileName())
            .status(profile.getStatus())
            .availability(availability)
            .pickCount(pickCount)
            .selectionCount(selectionCount)
            .gradeLevel(BabysitterGradeCalculator.levelFromSelectionCount(selectionCount))
            .averageRating(averageRating)
            .reviewCount(reviewCount)
            .regTime(profile.getRegTime())
            .modTime(profile.getModTime())
            .build();
    }
}
