package com.backend.hospital.emergency.service;

import com.backend.hospital.emergency.dto.EmergencyRoomSOSResponseDTO;

public interface EmergencyRoomSOSNoticeService {

    void notifyGuardian(
            EmergencyRoomSOSResponseDTO hospital,
            String notificationPhone,
            String memberEmail
    );
}
