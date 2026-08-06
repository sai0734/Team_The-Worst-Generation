package com.backend.auth.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.auth.dto.KakaoLinkRequestDTO;
import com.backend.auth.dto.KakaoLoginResultDTO;
import com.backend.auth.dto.SocialSignupRequestDTO;
import com.backend.auth.service.MemberService;
import com.backend.dto.MemberDTO;
import com.backend.dto.MemberModifyDTO;
import com.backend.global.util.CustomJWTException;
import com.backend.global.util.JWTUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@Log4j2
@RequiredArgsConstructor
public class SocialController {

  private final MemberService memberService;

  @GetMapping("/api/member/kakao")
  public ResponseEntity<Map<String, Object>> getMemberFromKakao(@RequestParam("accessToken") String accessToken) {

    KakaoLoginResultDTO loginResult;

    try {
      loginResult = memberService.getKakaoLoginResult(accessToken);
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "KAKAO_ACCESS_TOKEN_INVALID"));
    }

    if (!"LOGIN".equals(loginResult.getStatus())) {
      Map<String, Object> resultMap = new HashMap<>();
      resultMap.put("status", loginResult.getStatus());
      resultMap.put("email", loginResult.getEmail());
      resultMap.put("socialLinkToken", loginResult.getSocialLinkToken());
      return ResponseEntity.ok(resultMap);
    }

    return ResponseEntity.ok(createLoginResponse(loginResult.getMemberDTO()));
  }

  @PostMapping("/api/member/social/signup")
  public ResponseEntity<Map<String, Object>> signupAndLinkSocial(
      @RequestBody SocialSignupRequestDTO socialSignupRequestDTO) {

    try {
      MemberDTO memberDTO = memberService.signupAndLinkSocialMember(socialSignupRequestDTO);
      return ResponseEntity.ok(createLoginResponse(memberDTO));
    } catch (CustomJWTException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    } catch (IllegalStateException e) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }
  }

  private Map<String, Object> createLoginResponse(MemberDTO memberDTO) {

    Map<String, Object> claims = new HashMap<>(memberDTO.getClaims());
    claims.remove("pw");

    String jwtAccessToken = JWTUtil.generateToken(claims, 10);
    String jwtRefreshToken = JWTUtil.generateToken(claims, 60 * 24);

    claims.put("status", "LOGIN");
    claims.put("accessToken", jwtAccessToken);
    claims.put("refreshToken", jwtRefreshToken);

    return claims;
  }

  @PostMapping("/api/member/social/kakao/link")
  public ResponseEntity<Map<String, String>> linkKakao(
      @AuthenticationPrincipal MemberDTO memberDTO,
      @RequestBody KakaoLinkRequestDTO kakaoLinkRequestDTO) {

    if (memberDTO == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LOGIN_REQUIRED"));
    }

    if (kakaoLinkRequestDTO == null
        || kakaoLinkRequestDTO.getSocialLinkToken() == null
        || kakaoLinkRequestDTO.getSocialLinkToken().isBlank()) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "SOCIAL_LINK_TOKEN_REQUIRED"));
    }

    try {
      memberService.linkKakaoMember(memberDTO.getEmail(), kakaoLinkRequestDTO.getSocialLinkToken());
    } catch (CustomJWTException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    } catch (IllegalStateException e) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }

    return ResponseEntity.ok(Map.of("result", "linked"));
  }

  @PutMapping("/api/member/modify")
  public Map<String, String> modify(@RequestBody MemberModifyDTO memberModifyDTO) {

    log.info("member modify: " + memberModifyDTO);

    memberService.modifyMember(memberModifyDTO);

    return Map.of("result", "modified");
  }
}



