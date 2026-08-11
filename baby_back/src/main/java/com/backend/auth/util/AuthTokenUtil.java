package com.backend.auth.util;

import com.backend.auth.domain.Member;
import com.backend.global.util.JWTUtil;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

public class AuthTokenUtil {

    public static final String ACCESS_TOKEN_TYPE = "ACCESS";
    public static final String REFRESH_TOKEN_TYPE = "REFRESH";

    private AuthTokenUtil(){
    }

    // accessToken 생성
    public static String generateAccessToken(Map<String,Object> claims, int minutes){
        Map<String, Object> accessClaims = new HashMap<>(claims);
        accessClaims.put("tokenType", ACCESS_TOKEN_TYPE);

        return JWTUtil.generateToken(accessClaims, minutes);
    }

    // refreshToken 생성
    public static String generateRefreshToken(Map<String ,Object> claims,String sessionId, int minutes){
        Map<String, Object> refreshClaims = new HashMap<>(claims);
        refreshClaims.put("tokenType",REFRESH_TOKEN_TYPE);
        refreshClaims.put("sessionId", sessionId);

        return JWTUtil.generateToken(refreshClaims,minutes);
    }

    // JWT에 넣을 정보를 Member에서 가져옴
    public static Map<String, Object> createMemberClaims(Member member){
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", member.getEmail());
        claims.put("nickname", member.getNickname());
        claims.put("social", member.isSocial());
        claims.put("roleNames", member.getMemberRoleList()
                .stream()
                .map(role -> role.name())
                .collect(Collectors.toList()));

        return claims;
    }

    //refreshToken 발급 -> 브라우저 HttpOnly Cookie에 저장 -> DB에는 hash로 저장
    // refreshToken을 그냥 저장이 아닌 보안을 위해 변환해서 넣기
    public static String hashToken(String token){
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();

            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }

            return hex.toString();
        } catch (Exception e){
            throw new IllegalStateException("TOKEN_HASH_FAILED", e);
        }
    }
}
