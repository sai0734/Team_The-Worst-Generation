package com.backend.global.security.filter;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.backend.auth.dto.MemberDTO;
import com.backend.auth.util.AuthTokenUtil;
import com.backend.global.security.SecurityPaths;
import com.backend.global.util.CustomJWTException;
import com.backend.global.util.JWTUtil;
import com.google.gson.Gson;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class JWTCheckFilter extends OncePerRequestFilter {

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
    return HttpMethod.OPTIONS.matches(request.getMethod()) || SecurityPaths.isPublicPath(request.getRequestURI());
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    log.info("------------------------JWTCheckFilter------------------");

    try {
      String accessToken = getAccessToken(request);

      if (accessToken == null) {
        filterChain.doFilter(request, response);
        return;
      }

      Map<String, Object> claims = JWTUtil.validateToken(accessToken);

      if (!AuthTokenUtil.ACCESS_TOKEN_TYPE.equals(String.valueOf(claims.get("tokenType")))) {
        throw new CustomJWTException("INVALID_ACCESS_TOKEN");
      }

      log.info("JWT claims: " + claims);

      String email = (String) claims.get("email");
      String pw = (String) claims.getOrDefault("pw", "N/A");
      String nickname = (String) claims.get("nickname");
      boolean social = Boolean.TRUE.equals(claims.get("social"));
      List<String> roleNames = getRoleNames(claims.get("roleNames"));

      MemberDTO memberDTO = new MemberDTO(email, pw, nickname, social, roleNames);

      log.info("-----------------------------------");
      log.info(memberDTO);
      log.info(memberDTO.getAuthorities());

      UsernamePasswordAuthenticationToken authenticationToken =
          new UsernamePasswordAuthenticationToken(memberDTO, pw, memberDTO.getAuthorities());

      SecurityContextHolder.getContext().setAuthentication(authenticationToken);

      filterChain.doFilter(request, response);

    } catch (Exception e) {

      log.error("JWT Check Error..............");
      log.error(e.getMessage());

      String msg = new Gson().toJson(Map.of("error", "ERROR_ACCESS_TOKEN", "message", e.getMessage()));

      response.setStatus(HttpStatus.UNAUTHORIZED.value());
      response.setContentType("application/json; charset=UTF-8");
      PrintWriter printWriter = response.getWriter();
      printWriter.println(msg);
      printWriter.close();
    }
  }

  private String getAccessToken(HttpServletRequest request) {

    String authHeaderStr = request.getHeader("Authorization");

    if (authHeaderStr == null || authHeaderStr.isBlank()) {
      return null;
    }

    if (authHeaderStr.startsWith("Bearer ") == false) {
      throw new CustomJWTException("BADTYPE");
    }

    String accessToken = authHeaderStr.substring(7);

    if (accessToken.isBlank()) {
      throw new CustomJWTException("UNACCEPT");
    }

    return accessToken;
  }

  private List<String> getRoleNames(Object roleNames) {
    if (roleNames instanceof List<?> roles) {
      return roles.stream().map(String::valueOf).toList();
    }
    return List.of();
  }
}



