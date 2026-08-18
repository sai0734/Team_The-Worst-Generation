package com.backend.babysitter.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.auth.domain.Member;
import com.backend.auth.mapper.MemberMapper;
import com.backend.babysitter.domain.BabysitterJobPost;
import com.backend.babysitter.domain.BabysitterJobStatus;
import com.backend.babysitter.dto.BabysitterJobPostDTO;
import com.backend.babysitter.dto.BabysitterJobSearchDTO;
import com.backend.babysitter.mapper.BabysitterJobApplicationMapper;
import com.backend.babysitter.mapper.BabysitterJobPostMapper;
import com.backend.global.dto.PageResponseDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class BabysitterJobPostServiceImpl implements BabysitterJobPostService {

    // 하버사인 공식에서 각도 비율을 실제 km 거리로 환산할 때 곱하는 지구 반지름
    private static final int EARTH_RADIUS_KM = 6371;

    private final BabysitterJobPostMapper babysitterJobPostMapper;

    private final BabysitterJobApplicationMapper babysitterJobApplicationMapper;

    private final MemberMapper memberMapper;

    @Override
    public Long register(BabysitterJobPostDTO jobPostDTO) {

        BabysitterJobPost jobPost = BabysitterJobPost.builder()
            .parentEmail(jobPostDTO.getParentEmail())
            .title(jobPostDTO.getTitle())
            .region(jobPostDTO.getRegion())
            .latitude(jobPostDTO.getLatitude() != null ? BigDecimal.valueOf(jobPostDTO.getLatitude()) : null)
            .longitude(jobPostDTO.getLongitude() != null ? BigDecimal.valueOf(jobPostDTO.getLongitude()) : null)
            .desiredDate(jobPostDTO.getDesiredDate())
            .timeSlot(jobPostDTO.getTimeSlot())
            .hourlyRate(jobPostDTO.getHourlyRate())
            .message(jobPostDTO.getMessage())
            .status(BabysitterJobStatus.OPEN)
            .build();

        babysitterJobPostMapper.insert(jobPost);

        return jobPost.getJobNo();
    }

    @Override
    public BabysitterJobPostDTO get(Long jobNo) {

        BabysitterJobPost jobPost = findOrThrow(jobNo);

        return toDTO(jobPost);
    }

    @Override
    public PageResponseDTO<BabysitterJobPostDTO> getList(BabysitterJobSearchDTO searchDTO) {

        int skip = (searchDTO.getPage() - 1) * searchDTO.getSize();

        List<BabysitterJobPostDTO> dtoList = babysitterJobPostMapper.selectList(searchDTO, skip)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());

        long totalCount = babysitterJobPostMapper.selectListCount(searchDTO);

        return PageResponseDTO.<BabysitterJobPostDTO>withAll()
            .dtoList(dtoList)
            .totalCount(totalCount)
            .pageRequestDTO(searchDTO)
            .build();
    }

    @Override
    public List<BabysitterJobPostDTO> getNearby(double lat, double lng, double radiusKm) {

        List<BabysitterJobPost> candidates = babysitterJobPostMapper.selectNearbyCandidates();

        return candidates.stream()
            .map(jobPost -> {
                double distanceKm = haversineKm(
                    lat, lng,
                    jobPost.getLatitude().doubleValue(),
                    jobPost.getLongitude().doubleValue()
                );
                BabysitterJobPostDTO dto = toDTO(jobPost);
                dto.setDistanceKm(distanceKm);
                return dto;
            })
            .filter(dto -> dto.getDistanceKm() <= radiusKm)
            .sorted(Comparator.comparingDouble(BabysitterJobPostDTO::getDistanceKm))
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
    public List<BabysitterJobPostDTO> getMyJobPosts(String parentEmail) {

        return babysitterJobPostMapper.selectListByParent(parentEmail)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    public void cancel(Long jobNo, String parentEmail) {

        BabysitterJobPost jobPost = findOrThrow(jobNo);

        if (!jobPost.getParentEmail().equals(parentEmail)) {
            throw new AccessDeniedException("본인이 등록한 구인글만 취소할 수 있습니다.");
        }

        if (jobPost.getStatus() != BabysitterJobStatus.OPEN) {
            throw new IllegalStateException("이미 마감되었거나 취소된 구인글입니다.");
        }

        babysitterJobPostMapper.updateStatus(jobNo, BabysitterJobStatus.CANCELED);
    }

    private BabysitterJobPost findOrThrow(Long jobNo) {

        return Optional.ofNullable(babysitterJobPostMapper.selectByJobNo(jobNo))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 구인글입니다."));
    }

    private BabysitterJobPostDTO toDTO(BabysitterJobPost jobPost) {

        String parentNickname = Optional.ofNullable(memberMapper.selectByEmail(jobPost.getParentEmail()))
            .map(Member::getNickname)
            .orElse(null);

        long applicationCount = babysitterJobApplicationMapper.countByJob(jobPost.getJobNo());

        return BabysitterJobPostDTO.builder()
            .jobNo(jobPost.getJobNo())
            .parentEmail(jobPost.getParentEmail())
            .parentNickname(parentNickname)
            .title(jobPost.getTitle())
            .region(jobPost.getRegion())
            .latitude(jobPost.getLatitude() != null ? jobPost.getLatitude().doubleValue() : null)
            .longitude(jobPost.getLongitude() != null ? jobPost.getLongitude().doubleValue() : null)
            .desiredDate(jobPost.getDesiredDate())
            .timeSlot(jobPost.getTimeSlot())
            .hourlyRate(jobPost.getHourlyRate())
            .message(jobPost.getMessage())
            .status(jobPost.getStatus())
            .applicationCount(applicationCount)
            .regTime(jobPost.getRegTime())
            .modTime(jobPost.getModTime())
            .build();
    }
}
