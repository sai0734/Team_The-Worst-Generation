package com.backend.hospital.emergency.controller;

import com.backend.hospital.emergency.dto.EmergencyRoomSOSRequestDTO;
import com.backend.hospital.emergency.dto.EmergencyRoomSOSResultDTO;
import com.backend.hospital.emergency.service.EmergencyRoomSOSService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/emergency-rooms")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class EmergencySOSController {

    private final EmergencyRoomSOSService emergencyRoomSOSService;

    @PostMapping("/sos")
    public EmergencyRoomSOSResultDTO requestEmergencySOS(
            @RequestBody EmergencyRoomSOSRequestDTO request,
            Principal principal
    ) {
        return emergencyRoomSOSService.requestEmergencySOS(
                request.getLongitude(),
                request.getLatitude(),
                request.getStage1(),
                request.getStage2(),
                request.getPageNo(),
                request.getNumOfRows(),
                request.getNotificationPhone(),
                principal.getName()
        );
    }

}
