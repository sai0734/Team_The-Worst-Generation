package com.backend.auth.util;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import java.time.Duration;

public class AuthCookieUtil {

    public static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

    private AuthCookieUtil(){
    }

    // 백엔드 응답에 refreshToken 쿠키 심기
    public static void addRefreshTokenCookie(
            HttpServletResponse response, String refreshToken, int refreshTokenMinutes){
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/member")
                .maxAge(Duration.ofMinutes(refreshTokenMinutes))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // 브라우저에 저장된 refreshToken 쿠키 삭제
    public static void deleteRefreshTokenCookie(HttpServletResponse response){
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME,"")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/member")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE,cookie.toString());
    }

    // 요청 쿠키 목록에서 refreshToken 값을 찾아서 꺼냄
    public static String getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies()==null){
            return null;
        }

        for (var cookie : request.getCookies()) {
            if (REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    // 요청을 보낸 브라우저/앱 정보 가져오기(어떤 브라우저에서 로그인 했는지, 보안 로그 용)
    public static String getUserAgent(HttpServletRequest request){
        String userAgent = request.getHeader("User-Agent");

        if (userAgent == null) {
            return null;
        }

        return userAgent.length() > 255 ? userAgent.substring(0,255) : userAgent;
    }
}
