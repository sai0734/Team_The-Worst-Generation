package com.backend.emergency.controller;

import com.backend.emergency.dto.EmergencyRoomSOSResponseDTO;
import com.backend.emergency.service.EmergencyRoomSOSService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/emergency-rooms")
@RequiredArgsConstructor
public class EmergencySOSController {

    private final EmergencyRoomSOSService emergencyRoomSOSService;

    @GetMapping("/sos")
    public List<EmergencyRoomSOSResponseDTO> getEmergencyRooms(
            @RequestParam double longitude,
            @RequestParam double latitude,
            @RequestParam String stage1,
            @RequestParam String stage2,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows
    ) {
        return emergencyRoomSOSService.findEmergencyRooms(longitude, latitude, stage1, stage2, pageNo, numOfRows);
    }

}
