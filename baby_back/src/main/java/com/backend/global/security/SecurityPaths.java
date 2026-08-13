package com.backend.global.security;

import org.springframework.util.AntPathMatcher;

public final class SecurityPaths {

  // Public endpoints that do not require JWT validation.
  public static final String[] PUBLIC_URLS = {
      "/api/member/login",
      "/api/member/signup",
      "/api/member/kakao",
      "/api/member/social/signup",
      "/api/member/refresh",
      "/api/member/logout",
      "/api/products/view/**",
      "/api/community/posts/files/**",
      "/api/babysitter/profiles/files/**",
      "/api/openclaw/**",
          "/api/baby-info/view/**",
          "/api/diary/view/**",
          "/api/baby-album/view/**",
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



