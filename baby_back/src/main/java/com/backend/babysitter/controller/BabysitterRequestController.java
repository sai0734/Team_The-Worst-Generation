package com.backend.babysitter.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.babysitter.dto.BabysitterRequestDTO;
import com.backend.babysitter.service.BabysitterRequestService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/babysitter/requests")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class BabysitterRequestController {

    private final BabysitterRequestService babysitterRequestService;

    @PostMapping("/")
    public Map<String, Long> register(@RequestBody BabysitterRequestDTO requestDTO, Principal principal) {

        requestDTO.setParentEmail(principal.getName());

        Long requestNo = babysitterRequestService.register(requestDTO);

        return Map.of("requestNo", requestNo);
    }

    @GetMapping("/received")
    public List<BabysitterRequestDTO> received(Principal principal) {

        return babysitterRequestService.listReceived(principal.getName());
    }

    @GetMapping("/sent")
    public List<BabysitterRequestDTO> sent(Principal principal) {

        return babysitterRequestService.listSent(principal.getName());
    }

    @PutMapping("/{requestNo}/accept")
    public Map<String, String> accept(@PathVariable Long requestNo, Principal principal) {

        babysitterRequestService.accept(requestNo, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }

    @PutMapping("/{requestNo}/reject")
    public Map<String, String> reject(@PathVariable Long requestNo, Principal principal) {

        babysitterRequestService.reject(requestNo, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }

    @PutMapping("/{requestNo}/cancel")
    public Map<String, String> cancel(@PathVariable Long requestNo, Principal principal) {

        babysitterRequestService.cancel(requestNo, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }
}
