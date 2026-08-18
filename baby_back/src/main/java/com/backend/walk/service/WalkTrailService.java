package com.backend.walk.service;

import com.backend.walk.domain.WalkTrail;
import com.backend.walk.dto.WalkTrailDTO;
import com.backend.walk.mapper.WalkTrailMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class WalkTrailService implements WalkTrailServiceImpl {

    // 하버사인 공식에서 각도 비율을 실제 km 거리로 환산할 때 곱하는 지구 반지름
    private static final int EARTH_RADIUS_KM = 6371;

    private final WalkTrailMapper walkTrailMapper;

    @Override
    public List<WalkTrailDTO> getNearby(double lat, double lng, double radiusKm, int limit) {

        List<WalkTrail> candidates = walkTrailMapper.selectNearbyCandidates();

        return candidates.stream()
                .map(trail -> {
                    double distanceKm = haversinKm(
                            lat, lng,
                            trail.getLatitude().doubleValue(),
                            trail.getLongitude().doubleValue()
                    );
                    WalkTrailDTO walkTrailDTO = entityToDTO(trail);
                    walkTrailDTO.setDistanceKm(distanceKm);
                    return walkTrailDTO;
                })
                .filter(walkTrailDTO -> walkTrailDTO.getDistanceKm() <= radiusKm)
                .sorted(Comparator.comparingDouble(WalkTrailDTO::getDistanceKm))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private double haversinKm(double lat1, double lon1, double lat2, double lon2) {

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    @Override
    public Long register(WalkTrailDTO walkTrailDTO) {

        WalkTrail walkTrail = WalkTrail.builder()
                .name(walkTrailDTO.getName())
                .description(walkTrailDTO.getDescription())
                .locationName(walkTrailDTO.getLocationName())
                .latitude(walkTrailDTO.getLatitude())
                .longitude(walkTrailDTO.getLongitude())
                .build();

        walkTrailMapper.insert(walkTrail);

        return walkTrail.getTrailNo();
    }

    private WalkTrailDTO entityToDTO(WalkTrail walkTrail) {
        return WalkTrailDTO.builder()
                .trailNo(walkTrail.getTrailNo())
                .name(walkTrail.getName())
                .description(walkTrail.getDescription())
                .locationName(walkTrail.getLocationName())
                .latitude(walkTrail.getLatitude())
                .longitude(walkTrail.getLongitude())
                .regTime(walkTrail.getRegTime())
                .build();
    }
}