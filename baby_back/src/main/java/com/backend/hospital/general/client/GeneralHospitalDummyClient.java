package com.backend.hospital.general.client;

import com.backend.hospital.general.dto.GeneralHospitalResponseDTO;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.IntStream;

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
        String[] names = {"새봄", "우리아이", "튼튼", "햇살", "푸른", "사랑", "행복", "맑은", "한결", "늘봄"};
        String[] suffixes = {"소아청소년과의원", "가정의학과의원", "이비인후과의원", "내과의원", "아동병원"};
        String[] types = {"소아청소년과", "가정의학과", "이비인후과", "내과", "아동병원"};
        String[] districts = {"강남구", "서초구", "송파구", "강동구", "광진구", "성동구", "동작구", "마포구", "영등포구", "용산구"};
        String[] roads = {"테헤란로", "서초대로", "올림픽로", "천호대로", "아차산로", "왕십리로", "상도로", "월드컵로", "여의대로", "한강대로"};
        String[] startTimes = {"0830", "0900", "0930"};
        String[] endTimes = {"1800", "1830", "1900", "2000"};

        return IntStream.rangeClosed(1, 50)
                .mapToObj(index -> {
                    int nameIndex = (index - 1) % names.length;
                    int typeIndex = (index - 1) / names.length;
                    int locationIndex = (index * 7) % districts.length;

                    return hospital(
                            "G-HOSP-%03d".formatted(index),
                            names[nameIndex] + suffixes[typeIndex],
                            "서울특별시 " + districts[locationIndex] + " " + roads[locationIndex] + " " + (20 + index * 7),
                            types[typeIndex],
                            "02-%04d-%04d".formatted(2000 + index, 1000 + index),
                            37.46 + ((index * 17) % 100) * 0.001,
                            126.92 + ((index * 23) % 210) * 0.001,
                            startTimes[index % startTimes.length],
                            endTimes[index % endTimes.length]
                    );
                })
                .toList();
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
