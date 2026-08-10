package com.backend.global.security.filter;

import java.io.IOException;
import java.util.Map;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AbstractAuthenticationProcessingFilter;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class APILoginFilter extends AbstractAuthenticationProcessingFilter {

  private static final Gson GSON = new Gson();

  public APILoginFilter(String defaultFilterProcessesUrl) {
    super(defaultFilterProcessesUrl);
  }

  @Override
  public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
      throws AuthenticationException, IOException {

    log.info("------------------------APILoginFilter------------------------");

    if (!request.getMethod().equals("POST")) {
      throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
    }

    Map<?, ?> loginData;

    try {
      loginData = GSON.fromJson(request.getReader(), Map.class);
    } catch (JsonSyntaxException e) {
      throw new AuthenticationServiceException("Invalid login request", e);
    }

    String email = getValue(loginData, "email");
    String pw = getValue(loginData, "pw");

    if (email.isBlank() || pw.isBlank()) {
      throw new AuthenticationServiceException("Email and password are required");
    }

    UsernamePasswordAuthenticationToken authenticationToken =
        new UsernamePasswordAuthenticationToken(email, pw);

    authenticationToken.setDetails(authenticationDetailsSource.buildDetails(request));

    return getAuthenticationManager().authenticate(authenticationToken);
  }

  private String getValue(Map<?, ?> data, String key) {
    if (data == null || data.get(key) == null) {
      return "";
    }

    return String.valueOf(data.get(key));
  }
}



