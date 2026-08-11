package com.backend.auth.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.backend.auth.dto.MemberDTO;
import com.backend.auth.dto.MemberSignupRequestDTO;
import com.backend.auth.service.AuthTokenService;
import com.backend.auth.service.MemberService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class MemberController {

  private final MemberService memberService;
  private final AuthTokenService authTokenService;

  @PostMapping("/api/member/signup")
  public ResponseEntity<Map<String, Object>> signup(
      @RequestBody MemberSignupRequestDTO memberSignupRequestDTO,
      HttpServletRequest request,
      HttpServletResponse response) {

    try {
      MemberDTO memberDTO = memberService.signupMember(memberSignupRequestDTO);
      Map<String, Object> claims = authTokenService.issueLoginTokens(memberDTO, request, response);
      claims.put("status", "LOGIN");
      return ResponseEntity.ok(claims);
    } catch (IllegalStateException e) {
      HttpStatus status = "INVALID_SIGNUP_REQUEST".equals(e.getMessage())
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.CONFLICT;
      return ResponseEntity.status(status).body(Map.of("error", e.getMessage()));
    }
  }
}
