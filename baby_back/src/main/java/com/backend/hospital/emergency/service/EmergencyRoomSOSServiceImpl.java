package com.backend.hospital.emergency.service;

import com.backend.hospital.emergency.client.EmergencyApiClient;
import com.backend.hospital.emergency.dto.EmergencyRoomBedStatusDTO;
import com.backend.hospital.emergency.dto.EmergencyRoomLocationDTO;
import com.backend.hospital.emergency.dto.EmergencyRoomSOSResponseDTO;
import com.backend.hospital.emergency.dto.EmergencyRoomSOSResultDTO;
import com.backend.hospital.emergency.validation.EmergencyRoomSOSValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class EmergencyRoomSOSServiceImpl implements EmergencyRoomSOSService{

    private final EmergencyApiClient emergencyApiClient;
    private final EmergencyRoomSOSValidator emergencyRoomSOSValidator;
    private final EmergencyRoomSOSNoticeService emergencyRoomSOSNoticeService;

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

        List<EmergencyRoomBedStatusDTO> bedStatuses = searchBedStatusesSafely(
                stage1,
                stage2,
                pageNo,
                numOfRows
        );

        Map<String, EmergencyRoomBedStatusDTO> bedStatusByHospitalId = bedStatuses.stream()
                .filter(bedStatus -> bedStatus.getHpid() != null)
                .collect(Collectors.toMap(EmergencyRoomBedStatusDTO::getHpid, Function.identity(),(first, second) -> first));

        return locations.stream()
                .map(location -> toResponse(location, bedStatusByHospitalId.get(location.getHpid())))
                .sorted(recommendationComparator())
                .toList();
    }

    @Override
    public EmergencyRoomSOSResultDTO requestEmergencySOS(
            double longitude,
            double latitude,
            String stage1,
            String stage2,
            int pageNo,
            int numOfRows,
            String notificationPhone,
            String memberEmail
    ) {
        String normalizedPhone =
                emergencyRoomSOSValidator.validateNotificationPhone(notificationPhone);
        String requester =
                emergencyRoomSOSValidator.validateRequester(memberEmail);

        List<EmergencyRoomSOSResponseDTO> candidates =
                findEmergencyRooms(longitude, latitude, stage1, stage2, pageNo, numOfRows);

        if (candidates.isEmpty()) {
            throw new IllegalStateException("EMERGENCY_ROOM_NOT_FOUND");
        }

        EmergencyRoomSOSResponseDTO selectedHospital = candidates.get(0);
        emergencyRoomSOSNoticeService.notifyGuardian(
                selectedHospital,
                normalizedPhone,
                requester
        );

        return EmergencyRoomSOSResultDTO.builder()
                .selectedHospital(selectedHospital)
                .openClawPayload(toOpenClawPayload(selectedHospital, normalizedPhone))
                .candidates(candidates)
                .build();
    }




    // -----------------------
    // 조회용
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
    // ------------------------------
    // 요청용

    private List<EmergencyRoomBedStatusDTO> searchBedStatusesSafely(
            String stage1,
            String stage2,
            int pageNo,
            int numOfRows
    ) {
        if (stage1 == null || stage1.isBlank() || stage2 == null || stage2.isBlank()) {
            return List.of();
        }

        try {
            return emergencyApiClient.searchBedStatuses(stage1, stage2, pageNo, numOfRows);
        } catch (Exception exception) {
            log.warn("Emergency bed status lookup skipped: {}", exception.getMessage());
            return List.of();
        }
    }

    private EmergencyRoomSOSResultDTO.OpenClawPayloadDTO toOpenClawPayload(
            EmergencyRoomSOSResponseDTO hospital,
            String notificationPhone
    ) {
        return EmergencyRoomSOSResultDTO.OpenClawPayloadDTO.builder()
                .callTargetPhone(notificationPhone)
                .actualEmergencyPhone(hospital.getEmergencyPhone())
                .hospitalId(hospital.getHospitalId())
                .hospitalName(hospital.getHospitalName())
                .address(hospital.getAddress())
                .latitude(hospital.getLatitude())
                .longitude(hospital.getLongitude())
                .availableEmergencyBeds(hospital.getAvailableEmergencyBeds())
                .pediatricVentilatorAvailable(hospital.getPediatricVentilatorAvailable())
                .incubatorAvailable(hospital.getIncubatorAvailable())
                .callScript(buildCallScript(hospital))
                .build();
    }

    private String buildCallScript(EmergencyRoomSOSResponseDTO hospital) {
        return "소아 응급 환자 수용 가능 여부를 확인해주세요. "
                + "병원명: " + hospital.getHospitalName()
                + ", 주소: " + hospital.getAddress()
                + ", 공공 API 기준 응급실 가용 병상: " + hospital.getAvailableEmergencyBeds()
                + ", 소아 인공호흡기 가능 여부: " + hospital.getPediatricVentilatorAvailable()
                + ", 인큐베이터 가능 여부: " + hospital.getIncubatorAvailable();
    }


}
