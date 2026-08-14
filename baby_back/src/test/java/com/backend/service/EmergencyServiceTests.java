package com.backend.service;

import com.backend.hospital.emergency.client.EmergencyApiClient;
import com.backend.hospital.emergency.dto.EmergencyRoomBedStatusDTO;
import com.backend.hospital.emergency.dto.EmergencyRoomLocationDTO;
import com.backend.hospital.emergency.dto.EmergencyRoomSOSResponseDTO;
import com.backend.hospital.emergency.service.EmergencyRoomSOSService;
import com.backend.hospital.emergency.service.EmergencyRoomSOSServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class EmergencyServiceTests {

    @Mock
    EmergencyApiClient emergencyApiClient;

    EmergencyRoomSOSService service;

    @BeforeEach
    void setUp() {
        service = new EmergencyRoomSOSServiceImpl(emergencyApiClient);
    }

    @Test
    void findEmergencyRooms_mergesLocationAndBedStatusByHospitalId() {
        EmergencyRoomLocationDTO location = EmergencyRoomLocationDTO.builder()
                // 이 아래로는 실제로 받아오게 될 값을 넣어둔 형태
                .hpid("A1100010")
                .dutyName("삼성서울병원")
                .dutyAddr("서울특별시 강남구 일원로 81")
                .dutyDivName("종합병원")
                .dutyTel1("02-3410-2114")
                .latitude(37.488516)
                .longitude(127.086682)
                .distance(0.14)
                .startTime("0830")
                .endTime("1530")
                .build();

        EmergencyRoomBedStatusDTO bedStatus = EmergencyRoomBedStatusDTO.builder()
                .hpid("A1100010")
                .dutyName("삼성서울병원")
                .emergencyPhone("02-3410-3333")
                .availableEmergencyBeds(5)
                .operatingRoomAvailable(2)
                .pediatricVentiAvailable(true)
                .incubatorAvailable(true)
                .ctAvailable(true)
                .mriAvailable(true)
                .ventilatorAvailable(true)
                .updatedAt("20260811135507")
                .build();

        when(emergencyApiClient.searchLocations(127.086682, 37.488516, 1, 10))
                .thenReturn(List.of(location));

        when(emergencyApiClient.searchBedStatuses("서울특별시", "강남구", 1, 10))
                .thenReturn(List.of(bedStatus));

        List<EmergencyRoomSOSResponseDTO> result = service.findEmergencyRooms(
                127.086682,
                37.488516,
                "서울특별시",
                "강남구",
                1,
                10
        );

        assertThat(result).hasSize(1);

        EmergencyRoomSOSResponseDTO response = result.get(0);

        assertThat(response.getHospitalId()).isEqualTo("A1100010");
        assertThat(response.getHospitalName()).isEqualTo("삼성서울병원");
        assertThat(response.getAddress()).isEqualTo("서울특별시 강남구 일원로 81");
        assertThat(response.getMainPhone()).isEqualTo("02-3410-2114");
        assertThat(response.getEmergencyPhone()).isEqualTo("02-3410-3333");
        assertThat(response.getAvailableEmergencyBeds()).isEqualTo(5);
        assertThat(response.getAvailableOperatingRooms()).isEqualTo(2);
        assertThat(response.getPediatricVentilatorAvailable()).isTrue();
        assertThat(response.getIncubatorAvailable()).isTrue();
        assertThat(response.getCtAvailable()).isTrue();
        assertThat(response.getMriAvailable()).isTrue();
        assertThat(response.getVentilatorAvailable()).isTrue();
        assertThat(response.getKakaoMapTarget().getName()).isEqualTo("삼성서울병원");
        assertThat(response.getKakaoMapTarget().getLatitude()).isEqualTo(37.488516);
        assertThat(response.getKakaoMapTarget().getLongitude()).isEqualTo(127.086682);
    }
}