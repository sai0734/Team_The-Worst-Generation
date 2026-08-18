package com.backend.auth.service;

import com.backend.auth.dto.MemberDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Map;

public interface AuthTokenService {

    Map<String, Object> issueLoginTokens(
            MemberDTO memberDTO,
            HttpServletRequest request,
            HttpServletResponse response);

    Map<String, Object> refreshAccessToken(
            String refreshToken,
            HttpServletRequest request,
            HttpServletResponse response);

    Map<String, Object> selectProfile(String refreshToken, Long profileId);

    void logout(String refreshToken, HttpServletResponse response);
}

