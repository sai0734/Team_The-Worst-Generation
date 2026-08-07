package com.backend.babysitter.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.babysitter.dto.BabysitterProfileDTO;
import com.backend.babysitter.dto.BabysitterSearchDTO;
import com.backend.babysitter.service.BabysitterProfileService;
import com.backend.global.dto.PageResponseDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/babysitter/profiles")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class BabysitterProfileController {

    private final BabysitterProfileService babysitterProfileService;

    @GetMapping("/me")
    public BabysitterProfileDTO getMine(Principal principal) {

        return babysitterProfileService.get(principal.getName());
    }

    @GetMapping("/{email}")
    public BabysitterProfileDTO get(@PathVariable String email) {

        return babysitterProfileService.get(email);
    }

    @PutMapping("/")
    public Map<String, String> modify(@RequestBody BabysitterProfileDTO profileDTO, Principal principal) {

        profileDTO.setEmail(principal.getName());

        babysitterProfileService.modify(profileDTO);

        return Map.of("RESULT", "SUCCESS");
    }

    @DeleteMapping("/")
    public Map<String, String> remove(Principal principal) {

        babysitterProfileService.remove(principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }

    @GetMapping("/list")
    public PageResponseDTO<BabysitterProfileDTO> list(BabysitterSearchDTO searchDTO) {

        return babysitterProfileService.getList(searchDTO);
    }
}
