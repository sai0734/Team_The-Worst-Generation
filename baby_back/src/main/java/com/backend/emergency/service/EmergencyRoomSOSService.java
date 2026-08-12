package com.backend.emergency.service;

import com.backend.emergency.dto.EmergencyRoomSOSResponseDTO;

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
}
