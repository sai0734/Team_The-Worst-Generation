package com.backend.service;

import com.backend.hospital.general.client.GeneralHospitalDummyClient;
import com.backend.hospital.general.dto.GeneralHospitalResponseDTO;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GeneralHospitalDummyClientTests {

    @Test
    void generatesFiftyHospitalsWithUniqueIds() {
        List<GeneralHospitalResponseDTO> hospitals = new GeneralHospitalDummyClient()
                .searchHospitals(127.0276, 37.4979, "서울특별시", "강남구");

        assertEquals(50, hospitals.size());
        assertEquals(
                50,
                hospitals.stream().map(GeneralHospitalResponseDTO::getHospitalId).distinct().count()
        );
    }
}
