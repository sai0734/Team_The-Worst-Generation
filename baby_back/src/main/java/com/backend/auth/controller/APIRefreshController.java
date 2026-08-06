package com.backend.auth.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.global.util.CustomJWTException;
import com.backend.global.util.JWTUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
public class APIRefreshController {

  @RequestMapping("/api/member/refresh")
  public Map<String, Object> refresh(@RequestParam("refreshToken") String refreshToken) {

    if (refreshToken == null || refreshToken.isBlank()) {
      throw new CustomJWTException("NULL_REFRESH");
    }

    Map<String, Object> claims = JWTUtil.validateToken(refreshToken);

    log.info("refresh ... claims: " + claims);

    String newAccessToken = JWTUtil.generateToken(claims, 10);
    String newRefreshToken =
        checkTime((Integer) claims.get("exp")) ? JWTUtil.generateToken(claims, 60 * 24) : refreshToken;

    return Map.of("accessToken", newAccessToken, "refreshToken", newRefreshToken);
  }

  private boolean checkTime(Integer exp) {

    java.util.Date expDate = new java.util.Date((long) exp * 1000);
    long gap = expDate.getTime() - System.currentTimeMillis();
    long leftMin = gap / (1000 * 60);

    return leftMin < 60;
  }
}



