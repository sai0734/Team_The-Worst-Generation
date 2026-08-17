package com.backend.auth.profile.controller;

import com.backend.auth.profile.dto.MemberProfileDTO;
import com.backend.auth.profile.dto.MemberProfileSelectDTO;
import com.backend.auth.profile.service.MemberProfileService;
import com.backend.auth.service.AuthTokenService;
import com.backend.auth.util.AuthCookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/member/profiles")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class MemberProfileController {

    private final MemberProfileService memberProfileService;
    private final AuthTokenService authTokenService;

    @PostMapping
    public Map<String, Long> register(
            Principal principal,
            @RequestBody MemberProfileDTO memberProfileDTO
    ) {
        Long profileId = memberProfileService.register(principal.getName(), memberProfileDTO);

        return Map.of("profileId", profileId);
    }

    @GetMapping
    public List<MemberProfileDTO> listMine(Principal principal) {
        return memberProfileService.listMine(principal.getName());
    }

    @GetMapping("/{profileId}")
    public MemberProfileDTO get(
            Principal principal,
            @PathVariable Long profileId
    ) {
        return memberProfileService.selectProfile(principal.getName(), profileId);
    }

    @PostMapping("/select")
    public Map<String, Object> select(
            HttpServletRequest request,
            @RequestBody MemberProfileSelectDTO selectDTO
    ) {
        return authTokenService.selectProfile(
                AuthCookieUtil.getRefreshTokenFromCookie(request), selectDTO.getProfileId());
    }

    @PutMapping("/{profileId}")
    public Map<String, String> modify(
            Principal principal,
            @PathVariable Long profileId,
            @RequestBody MemberProfileDTO memberProfileDTO
    ) {
        memberProfileService.modify(principal.getName(), profileId, memberProfileDTO);

        return Map.of("RESULT", "SUCCESS");
    }

    @DeleteMapping("/{profileId}")
    public Map<String, String> remove(
            Principal principal,
            @PathVariable Long profileId
    ) {
        memberProfileService.remove(principal.getName(), profileId);

        return Map.of("RESULT", "SUCCESS");
    }
}
