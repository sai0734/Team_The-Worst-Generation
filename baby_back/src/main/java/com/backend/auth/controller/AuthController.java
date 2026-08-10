package com.backend.auth.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.backend.auth.service.AuthTokenService;
import com.backend.auth.util.AuthCookieUtil;
import com.backend.global.util.CustomJWTException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
public class AuthController {

  private final AuthTokenService authTokenService;

  @PostMapping("/api/member/refresh")
  public ResponseEntity<Map<String, Object>> refresh(
          HttpServletRequest request,
          HttpServletResponse response) {

    String refreshToken = AuthCookieUtil.getRefreshTokenFromCookie(request);

    try {
      Map<String, Object> result = authTokenService.refreshAccessToken(refreshToken, request, response);
      return ResponseEntity.ok(result);
    } catch (CustomJWTException e) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/api/member/logout")
  public ResponseEntity<Map<String, String>> logout(
          HttpServletRequest request,
          HttpServletResponse response) {

    String refreshToken = AuthCookieUtil.getRefreshTokenFromCookie(request);

    authTokenService.logout(refreshToken, response);

    return ResponseEntity.ok(Map.of("result", "logout"));
  }
}