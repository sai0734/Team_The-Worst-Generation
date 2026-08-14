package com.backend.hospital.general.controller;

import com.backend.hospital.general.dto.GeneralHospitalReservationDTO;
import com.backend.hospital.general.service.GeneralHospitalReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/hospitals/reservations")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class GeneralHospitalReservationController {

    private final GeneralHospitalReservationService generalHospitalReservationService;

    @PostMapping("/")
    public Map<String, Long> register(
            @RequestBody GeneralHospitalReservationDTO reservationDTO,
            Principal principal
    ) {
        reservationDTO.setMemberEmail(principal.getName());

        Long reservationNo = generalHospitalReservationService.register(reservationDTO);

        return Map.of("reservationNo", reservationNo);
    }

    @GetMapping("/me")
    public List<GeneralHospitalReservationDTO> mine(Principal principal) {
        return generalHospitalReservationService.listMine(principal.getName());
    }

    @PutMapping("/{reservationNo}/cancel")
    public Map<String, String> cancel(
            @PathVariable Long reservationNo,
            Principal principal
    ) {
        generalHospitalReservationService.cancel(reservationNo, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }
}
