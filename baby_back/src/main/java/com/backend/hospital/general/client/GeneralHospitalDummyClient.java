package com.backend.hospital.general.client;

import com.backend.hospital.general.dto.GeneralHospitalResponseDTO;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GeneralHospitalDummyClient {

    public List<GeneralHospitalResponseDTO> searchHospitals(
            double longitude,
            double latitude,
            String stage1,
            String stage2
    ) {
        return dummyHospitals().stream()
                .map(hospital -> withDistance(hospital, longitude, latitude))
                .toList();
    }

    private List<GeneralHospitalResponseDTO> dummyHospitals() {
        return List.of(
                hospital("G-HOSP-001", "튼튼아이소아청소년과의원", "서울특별시 강남구 테헤란로 123", "소아청소년과", "02-1111-1001", 37.501274, 127.039585, "0900", "1830"),
                hospital("G-HOSP-002", "맘편한소아과의원", "서울특별시 강남구 선릉로 90", "소아청소년과", "02-1111-1002", 37.492361, 127.030569, "0830", "1900"),
                hospital("G-HOSP-003", "아이사랑가정의학과", "서울특별시 서초구 서초대로 250", "가정의학과", "02-1111-1003", 37.494931, 127.014869, "0900", "1800"),
                hospital("G-HOSP-004", "푸른소아청소년과의원", "서울특별시 송파구 올림픽로 300", "소아청소년과", "02-1111-1004", 37.514575, 127.105399, "0900", "2000"),
                hospital("G-HOSP-005", "해맑은이비인후과의원", "서울특별시 강남구 도산대로 45", "이비인후과", "02-1111-1005", 37.517236, 127.022945, "0930", "1830")
        );
    }

    private GeneralHospitalResponseDTO hospital(
            String hospitalId,
            String hospitalName,
            String address,
            String hospitalType,
            String mainPhone,
            double latitude,
            double longitude,
            String startTime,
            String endTime
    ) {
        return GeneralHospitalResponseDTO.builder()
                .hospitalId(hospitalId)
                .hospitalName(hospitalName)
                .address(address)
                .hospitalType(hospitalType)
                .mainPhone(mainPhone)
                .latitude(latitude)
                .longitude(longitude)
                .startTime(startTime)
                .endTime(endTime)
                .kakaoMapTarget(GeneralHospitalResponseDTO.KakaoMapTargetDTO.builder()
                        .name(hospitalName)
                        .latitude(latitude)
                        .longitude(longitude)
                        .build())
                .build();
    }

    private GeneralHospitalResponseDTO withDistance(
            GeneralHospitalResponseDTO hospital,
            double userLongitude,
            double userLatitude
    ) {
        double distance = calculateDistance(userLatitude, userLongitude, hospital.getLatitude(), hospital.getLongitude());

        return GeneralHospitalResponseDTO.builder()
                .hospitalId(hospital.getHospitalId())
                .hospitalName(hospital.getHospitalName())
                .address(hospital.getAddress())
                .hospitalType(hospital.getHospitalType())
                .mainPhone(hospital.getMainPhone())
                .emergencyPhone(hospital.getEmergencyPhone())
                .distance(Math.round(distance * 100.0) / 100.0)
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
                .kakaoMapTarget(hospital.getKakaoMapTarget())
                .build();
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }
}
