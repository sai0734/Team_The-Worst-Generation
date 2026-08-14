package com.backend.hospital.emergency.controller;

import com.backend.hospital.emergency.dto.EmergencyRoomSOSRequestDTO;
import com.backend.hospital.emergency.dto.EmergencyRoomSOSResultDTO;
import com.backend.hospital.emergency.service.EmergencyRoomSOSService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/emergency-rooms")
@RequiredArgsConstructor
public class EmergencySOSController {

    private final EmergencyRoomSOSService emergencyRoomSOSService;

    @PostMapping("/sos")
    public EmergencyRoomSOSResultDTO requestEmergencySOS(
            @RequestBody EmergencyRoomSOSRequestDTO request
    ) {
        return emergencyRoomSOSService.requestEmergencySOS(
                request.getLongitude(),
                request.getLatitude(),
                request.getStage1(),
                request.getStage2(),
                request.getPageNo(),
                request.getNumOfRows(),
                request.getTestTargetPhone()
        );
    }

}
