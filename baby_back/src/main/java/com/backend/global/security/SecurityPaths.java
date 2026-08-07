package com.backend.global.security;

import org.springframework.util.AntPathMatcher;

public final class SecurityPaths {

  // Public endpoints that do not require JWT validation.
  public static final String[] PUBLIC_URLS = {
      "/api/member/login",
      "/api/member/kakao",
      "/api/member/social/signup",
      "/api/member/refresh",
      "/api/products/view/**",
      "/api/openclaw/**",
          "/api/baby-info/view/**",
  };

  private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

  private SecurityPaths() {
  }

  public static boolean isPublicPath(String path) {
    for (String pattern : PUBLIC_URLS) {
      if (PATH_MATCHER.match(pattern, path)) {
        return true;
      }
    }
    return false;
  }
}



