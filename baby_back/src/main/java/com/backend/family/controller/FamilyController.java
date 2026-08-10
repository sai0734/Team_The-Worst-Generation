package com.backend.family.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.backend.auth.dto.MemberDTO;
import com.backend.family.dto.FamilyCreateDTO;
import com.backend.family.dto.FamilyDTO;
import com.backend.family.dto.FamilyJoinDTO;
import com.backend.family.dto.FamilyMemberDTO;
import com.backend.family.service.FamilyService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/family")
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createFamily(
            @AuthenticationPrincipal MemberDTO memberDTO,
            @RequestBody FamilyCreateDTO familyCreateDTO) {

        if (memberDTO == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LOGIN_REQUIRED"));
        }

        FamilyDTO familyDTO = familyService.createFamily(memberDTO.getEmail(), familyCreateDTO);
        return ResponseEntity.ok(Map.of("family", familyDTO));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyFamily(
            @AuthenticationPrincipal MemberDTO memberDTO) {

        if (memberDTO == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LOGIN_REQUIRED"));
        }

        FamilyDTO familyDTO = familyService.getMyFamily(memberDTO.getEmail());
        return ResponseEntity.ok(Map.of("family", familyDTO));
    }

    @GetMapping("/members")
    public ResponseEntity<Map<String, Object>> getMyFamilyMembers(
            @AuthenticationPrincipal MemberDTO memberDTO) {

        if (memberDTO == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LOGIN_REQUIRED"));
        }

        List<FamilyMemberDTO> members = familyService.getMyFamilyMembers(memberDTO.getEmail());
        return ResponseEntity.ok(Map.of("members", members));
    }

    @PostMapping("/join")
    public ResponseEntity<Map<String, Object>> joinFamily(
            @AuthenticationPrincipal MemberDTO memberDTO,
            @RequestBody FamilyJoinDTO familyJoinDTO) {

        if (memberDTO == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LOGIN_REQUIRED"));
        }

        FamilyDTO familyDTO = familyService.joinFamily(memberDTO.getEmail(), familyJoinDTO);
        return ResponseEntity.ok(Map.of("family", familyDTO));
    }

    @DeleteMapping("/leave")
    public ResponseEntity<Map<String, String>> leaveFamily(
            @AuthenticationPrincipal MemberDTO memberDTO) {

        if (memberDTO == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LOGIN_REQUIRED"));
        }

        familyService.leaveFamily(memberDTO.getEmail());
        return ResponseEntity.ok(Map.of("result", "left"));
    }
}
