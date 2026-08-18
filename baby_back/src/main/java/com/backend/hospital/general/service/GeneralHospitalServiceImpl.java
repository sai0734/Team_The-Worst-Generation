package com.backend.hospital.general.service;

import com.backend.hospital.general.client.GeneralHospitalDummyClient;
import com.backend.hospital.general.dto.GeneralHospitalResponseDTO;
import com.backend.hospital.general.dto.GeneralHospitalWaitingDTO;
import com.backend.hospital.general.dto.GeneralHospitalWaitingRefreshResultDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class GeneralHospitalServiceImpl implements GeneralHospitalService {

    private static final int REFRESH_COOLDOWN_SECONDS = 30;

    private final GeneralHospitalDummyClient generalHospitalDummyClient;
    private final Map<String, Integer> waitingCountByHospitalId = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastRefreshByMember = new ConcurrentHashMap<>();

    @Override
    public List<GeneralHospitalResponseDTO> searchHospitals(
            double longitude,
            double latitude,
            String stage1,
            String stage2,
            int pageNo,
            int numOfRows
    ) {
        return generalHospitalDummyClient.searchHospitals(longitude, latitude, stage1, stage2).stream()
                .map(hospital -> withWaitingCount(hospital, 0))
                .sorted(recommendationComparator())
                .skip((long) Math.max(pageNo - 1, 0) * Math.max(numOfRows, 1))
                .limit(Math.max(numOfRows, 1))
                .toList();
    }

    @Override
    public GeneralHospitalWaitingRefreshResultDTO refreshWaitingCounts(
            String memberEmail,
            List<String> hospitalIds
    ) {
        String refreshKey = memberEmail == null || memberEmail.isBlank() ? "anonymous" : memberEmail;
        Instant now = Instant.now();
        Instant lastRefresh = lastRefreshByMember.get(refreshKey);

        if (lastRefresh != null) {
            long elapsedSeconds = Duration.between(lastRefresh, now).toSeconds();
            if (elapsedSeconds < REFRESH_COOLDOWN_SECONDS) {
                return GeneralHospitalWaitingRefreshResultDTO.builder()
                        .refreshLimited(true)
                        .retryAfterSeconds((int) (REFRESH_COOLDOWN_SECONDS - elapsedSeconds))
                        .hospitals(currentWaitingCounts(hospitalIds))
                        .build();
            }
        }

        lastRefreshByMember.put(refreshKey, now);

        return GeneralHospitalWaitingRefreshResultDTO.builder()
                .refreshLimited(false)
                .retryAfterSeconds(0)
                .hospitals(refreshedWaitingCounts(hospitalIds))
                .build();
    }

    private GeneralHospitalResponseDTO withWaitingCount(
            GeneralHospitalResponseDTO hospital,
            int waitingChange
    ) {
        int waitingCount = waitingCountByHospitalId.computeIfAbsent(
                hospital.getHospitalId(),
                this::initialWaitingCount
        );

        return GeneralHospitalResponseDTO.builder()
                .hospitalId(hospital.getHospitalId())
                .hospitalName(hospital.getHospitalName())
                .address(hospital.getAddress())
                .hospitalType(hospital.getHospitalType())
                .mainPhone(hospital.getMainPhone())
                .emergencyPhone(hospital.getEmergencyPhone())
                .distance(hospital.getDistance())
                .latitude(hospital.getLatitude())
                .longitude(hospital.getLongitude())
                .startTime(hospital.getStartTime())
                .endTime(hospital.getEndTime())
                .availableEmergencyBeds(hospital.getAvailableEmergencyBeds())
                .availableOperatingRooms(hospital.getAvailableOperatingRooms())
                .pediatricVentilatorAvailable(hospital.getPediatricVentilatorAvailable())
                .incubatorAvailable(hospital.getIncubatorAvailable())
                .ctAvailable(hospital.getCtAvailable())
                .mriAvailable(hospital.getMriAvailable())
                .ventilatorAvailable(hospital.getVentilatorAvailable())
                .updatedAt(hospital.getUpdatedAt())
                .waitingPatientCount(waitingCount)
                .waitingChange(waitingChange)
                .kakaoMapTarget(hospital.getKakaoMapTarget())
                .build();
    }

    private List<GeneralHospitalWaitingDTO> currentWaitingCounts(List<String> hospitalIds) {
        return safeHospitalIds(hospitalIds).stream()
                .map(hospitalId -> {
                    int waitingCount = waitingCountByHospitalId.computeIfAbsent(hospitalId, this::initialWaitingCount);
                    return GeneralHospitalWaitingDTO.builder()
                            .hospitalId(hospitalId)
                            .waitingPatientCount(waitingCount)
                            .waitingChange(0)
                            .build();
                })
                .toList();
    }

    private List<GeneralHospitalWaitingDTO> refreshedWaitingCounts(List<String> hospitalIds) {
        return safeHospitalIds(hospitalIds).stream()
                .map(hospitalId -> {
                    int previousCount = waitingCountByHospitalId.computeIfAbsent(hospitalId, this::initialWaitingCount);
                    int nextCount = Math.max(0, previousCount + ThreadLocalRandom.current().nextInt(-1, 2));
                    waitingCountByHospitalId.put(hospitalId, nextCount);

                    return GeneralHospitalWaitingDTO.builder()
                            .hospitalId(hospitalId)
                            .waitingPatientCount(nextCount)
                            .waitingChange(nextCount - previousCount)
                            .build();
                })
                .toList();
    }

    private List<String> safeHospitalIds(List<String> hospitalIds) {
        if (hospitalIds == null) {
            return List.of();
        }
        return hospitalIds.stream()
                .filter(hospitalId -> hospitalId != null && !hospitalId.isBlank())
                .distinct()
                .toList();
    }

    private int initialWaitingCount(String hospitalId) {
        return Math.abs(hospitalId.hashCode() % 6);
    }

    private Comparator<GeneralHospitalResponseDTO> recommendationComparator() {
        return Comparator
                .comparing(
                        GeneralHospitalResponseDTO::getWaitingPatientCount,
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
                .thenComparing(
                        GeneralHospitalResponseDTO::getDistance,
                        Comparator.nullsLast(Comparator.naturalOrder())
                );
    }
}
