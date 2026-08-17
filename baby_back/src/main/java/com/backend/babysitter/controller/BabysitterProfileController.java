package com.backend.babysitter.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.backend.babysitter.dto.BabysitterProfileDTO;
import com.backend.babysitter.dto.BabysitterSearchDTO;
import com.backend.babysitter.service.BabysitterProfileService;
import com.backend.global.dto.PageResponseDTO;
import com.backend.global.util.CustomFileUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/babysitter/profiles")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class BabysitterProfileController {

    private final BabysitterProfileService babysitterProfileService;

    private final CustomFileUtil fileUtil;

    @PreAuthorize("permitAll()")
    @GetMapping("/files/{fileName}")
    public ResponseEntity<Resource> viewFile(@PathVariable String fileName) {

        return fileUtil.getFile(fileName);
    }

    @GetMapping("/me")
    public BabysitterProfileDTO getMine(Principal principal) {

        return babysitterProfileService.get(principal.getName());
    }

    @PostMapping("/me/photo")
    public Map<String, String> changePhoto(
        @RequestParam("file") MultipartFile file,
        Principal principal
    ) {

        String fileName = babysitterProfileService.changeProfileImage(principal.getName(), file);

        return Map.of("fileName", fileName);
    }

    @GetMapping("/picks/mine")
    public List<BabysitterProfileDTO> myPicks(Principal principal) {

        return babysitterProfileService.getMyPicks(principal.getName());
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

    // 내 위치(lat, lng) 기준 반경 radiusKm(기본 5km) 안의 활동중인 시터, 가까운 순
    @GetMapping("/nearby")
    public List<BabysitterProfileDTO> nearby(
        @RequestParam double lat,
        @RequestParam double lng,
        @RequestParam(defaultValue = "5") double radiusKm
    ) {
        return babysitterProfileService.getNearby(lat, lng, radiusKm);
    }
}
