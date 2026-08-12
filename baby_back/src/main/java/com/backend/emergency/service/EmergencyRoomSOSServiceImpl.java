package com.backend.emergency.service;

import com.backend.emergency.client.EmergencyApiClient;
import com.backend.emergency.dto.EmergencyRoomBedStatusDTO;
import com.backend.emergency.dto.EmergencyRoomLocationDTO;
import com.backend.emergency.dto.EmergencyRoomSOSResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmergencyRoomSOSServiceImpl implements EmergencyRoomSOSService{

    private final EmergencyApiClient emergencyApiClient;

    @Override
    public List<EmergencyRoomSOSResponseDTO> findEmergencyRooms(
            double longitude,
            double latitude,
            String stage1,
            String stage2,
            int pageNo,
            int numOfRows
    ) {
        List<EmergencyRoomLocationDTO> locations = emergencyApiClient.searchLocations(longitude, latitude, pageNo, numOfRows);

        List<EmergencyRoomBedStatusDTO> bedStatuses = emergencyApiClient.searchBedStatuses(stage1, stage2, pageNo, numOfRows);

        Map<String, EmergencyRoomBedStatusDTO> bedStatusByHospitalId = bedStatuses.stream()
                .filter(bedStatus -> bedStatus.getHpid() != null)
                .collect(Collectors.toMap(EmergencyRoomBedStatusDTO::getHpid, Function.identity(),(first, second) -> first));

        return locations.stream()
                .map(location -> toResponse(location, bedStatusByHospitalId.get(location.getHpid())))
                .sorted(recommendationComparator())
                .toList();
    }


    // -----------------------
    private EmergencyRoomSOSResponseDTO toResponse(
            EmergencyRoomLocationDTO location,
            EmergencyRoomBedStatusDTO bedStatus
    ) {
        return EmergencyRoomSOSResponseDTO.builder()
                .hospitalId(location.getHpid())
                .hospitalName(location.getDutyName())
                .address(location.getDutyAddr())
                .hospitalType(location.getDutyDivName())
                .mainPhone(location.getDutyTel1())
                .emergencyPhone(bedStatus == null ? null : bedStatus.getEmergencyPhone())
                .distance(location.getDistance())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .startTime(location.getStartTime())
                .endTime(location.getEndTime())
                .availableEmergencyBeds(bedStatus == null ? null : bedStatus.getAvailableEmergencyBeds())
                .availableOperatingRooms(bedStatus == null ? null : bedStatus.getOperatingRoomAvailable())
                .pediatricVentilatorAvailable(bedStatus == null ? null : bedStatus.getPediatricVentiAvailable())
                .incubatorAvailable(bedStatus == null ? null : bedStatus.getIncubatorAvailable())
                .ctAvailable(bedStatus == null ? null : bedStatus.getCtAvailable())
                .mriAvailable(bedStatus == null ? null : bedStatus.getMriAvailable())
                .ventilatorAvailable(bedStatus == null ? null : bedStatus.getVentilatorAvailable())
                .updatedAt(bedStatus == null ? null : bedStatus.getUpdatedAt())
                .kakaoMapTarget(toKakaoMapTarget(location))
                .build();
    }
    private EmergencyRoomSOSResponseDTO.KakaoMapTargetDTO toKakaoMapTarget(
            EmergencyRoomLocationDTO location
    ) {
        return EmergencyRoomSOSResponseDTO.KakaoMapTargetDTO.builder()
                .name(location.getDutyName())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .build();
    }

    private Comparator<EmergencyRoomSOSResponseDTO> recommendationComparator() {
        return Comparator
                .comparing(
                        EmergencyRoomSOSResponseDTO::getAvailableEmergencyBeds,
                        Comparator.nullsLast(Comparator.reverseOrder())
                )
                .thenComparing(
                        EmergencyRoomSOSResponseDTO::getDistance,
                        Comparator.nullsLast(Comparator.naturalOrder())
                );
    }


}
