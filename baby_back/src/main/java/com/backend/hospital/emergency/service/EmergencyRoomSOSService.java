package com.backend.hospital.emergency.service;

import com.backend.hospital.emergency.dto.EmergencyRoomSOSResponseDTO;
import com.backend.hospital.emergency.dto.EmergencyRoomSOSResultDTO;

import java.util.List;

public interface EmergencyRoomSOSService {

    List<EmergencyRoomSOSResponseDTO> findEmergencyRooms(
            double longitude,
            double latitude,
            String stage1,
            String stage2,
            int pageNo,
            int numOfRows
    );

    EmergencyRoomSOSResultDTO requestEmergencySOS(
            double longitude,
            double latitude,
            String stage1,
            String stage2,
            int pageNo,
            int numOfRows,
            String testTargetPhone
    );
}
