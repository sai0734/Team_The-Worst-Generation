package com.backend.auth.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.auth.domain.Member;
import com.backend.auth.domain.MemberRefreshToken;
import com.backend.auth.dto.MemberDTO;
import com.backend.auth.mapper.MemberMapper;
import com.backend.auth.mapper.MemberRefreshTokenMapper;
import com.backend.auth.util.AuthCookieUtil;
import com.backend.auth.util.AuthTokenUtil;
import com.backend.global.util.CustomJWTException;
import com.backend.global.util.JWTUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthTokenServiceImpl implements AuthTokenService {

    private static final int ACCESS_TOKEN_MINUTES = 10;
    private static final int REFRESH_TOKEN_MINUTES = 60 * 24;

    private final MemberMapper memberMapper;
    private final MemberRefreshTokenMapper memberRefreshTokenMapper;

    @Override
    public Map<String, Object> issueLoginTokens(
            MemberDTO memberDTO,
            HttpServletRequest request,
            HttpServletResponse response) {

        Map<String, Object> claims = new HashMap<>(memberDTO.getClaims());

        String sessionId = UUID.randomUUID().toString();
        String accessToken = AuthTokenUtil.generateAccessToken(claims, ACCESS_TOKEN_MINUTES);
        String refreshToken = AuthTokenUtil.generateRefreshToken(claims, sessionId, REFRESH_TOKEN_MINUTES);

        memberRefreshTokenMapper.insert(MemberRefreshToken.builder()
                .memberEmail(memberDTO.getEmail())
                .sessionId(sessionId)
                .tokenHash(AuthTokenUtil.hashToken(refreshToken))
                .expiresAt(LocalDateTime.now().plusMinutes(REFRESH_TOKEN_MINUTES))
                .userAgent(AuthCookieUtil.getUserAgent(request))
                .build());

        AuthCookieUtil.addRefreshTokenCookie(response, refreshToken, REFRESH_TOKEN_MINUTES);

        claims.put("accessToken", accessToken);
        return claims;
    }

    @Override
    @Transactional(noRollbackFor = CustomJWTException.class)
    public Map<String, Object> refreshAccessToken(
            String refreshToken,
            HttpServletRequest request,
            HttpServletResponse response) {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new CustomJWTException("NULL_REFRESH");
        }

        String tokenHash = AuthTokenUtil.hashToken(refreshToken);

        MemberRefreshToken savedToken = Optional
                .ofNullable(memberRefreshTokenMapper.selectByTokenHash(tokenHash))
                .orElseThrow(() -> new CustomJWTException("INVALID_REFRESH"));

        if (savedToken.isRevoked() || savedToken.getUsedAt() != null) {
            memberRefreshTokenMapper.revokeAllBySessionId(savedToken.getSessionId());
            throw new CustomJWTException("REUSED_REFRESH");
        }

        if (savedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            memberRefreshTokenMapper.revokeByTokenHash(tokenHash);
            throw new CustomJWTException("EXPIRED_REFRESH");
        }

        Map<String, Object> refreshClaims = JWTUtil.validateToken(refreshToken);
        validateRefreshClaims(refreshClaims, savedToken);

        int updatedCount = memberRefreshTokenMapper.markUsed(savedToken.getId());

        if (updatedCount != 1) {
            memberRefreshTokenMapper.revokeAllBySessionId(savedToken.getSessionId());
            throw new CustomJWTException("REUSED_REFRESH");
        }

        Member member = Optional.ofNullable(memberMapper.selectByEmail(savedToken.getMemberEmail()))
                .orElseThrow(() -> new CustomJWTException("MEMBER_NOT_FOUND"));

        Map<String, Object> claims = AuthTokenUtil.createMemberClaims(member);

        String newAccessToken = AuthTokenUtil.generateAccessToken(claims, ACCESS_TOKEN_MINUTES);
        String newRefreshToken = AuthTokenUtil.generateRefreshToken(
                claims,
                savedToken.getSessionId(),
                REFRESH_TOKEN_MINUTES);

        memberRefreshTokenMapper.insert(MemberRefreshToken.builder()
                .memberEmail(member.getEmail())
                .sessionId(savedToken.getSessionId())
                .tokenHash(AuthTokenUtil.hashToken(newRefreshToken))
                .expiresAt(LocalDateTime.now().plusMinutes(REFRESH_TOKEN_MINUTES))
                .userAgent(AuthCookieUtil.getUserAgent(request))
                .build());

        AuthCookieUtil.addRefreshTokenCookie(response, newRefreshToken, REFRESH_TOKEN_MINUTES);

        return Map.of("accessToken", newAccessToken);
    }

    @Override
    public void logout(String refreshToken, HttpServletResponse response) {

        if (refreshToken != null && !refreshToken.isBlank()) {
            memberRefreshTokenMapper.revokeByTokenHash(AuthTokenUtil.hashToken(refreshToken));
        }

        AuthCookieUtil.deleteRefreshTokenCookie(response);
    }

    private void validateRefreshClaims(Map<String, Object> refreshClaims, MemberRefreshToken savedToken) {

        if (!AuthTokenUtil.REFRESH_TOKEN_TYPE.equals(String.valueOf(refreshClaims.get("tokenType")))) {
            throw new CustomJWTException("INVALID_REFRESH");
        }

        if (!savedToken.getSessionId().equals(String.valueOf(refreshClaims.get("sessionId")))) {
            memberRefreshTokenMapper.revokeAllBySessionId(savedToken.getSessionId());
            throw new CustomJWTException("INVALID_REFRESH");
        }
    }
}
