package com.backend.global.security.handler;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import com.backend.auth.dto.MemberDTO;
import com.backend.auth.service.AuthTokenService;
import com.google.gson.Gson;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class APILoginSuccessHandler implements AuthenticationSuccessHandler {

  private final AuthTokenService authTokenService;

  public APILoginSuccessHandler(AuthTokenService authTokenService) {
    this.authTokenService = authTokenService;
  }

  @Override
  public void onAuthenticationSuccess(
          HttpServletRequest request,
          HttpServletResponse response,
          Authentication authentication) throws IOException, ServletException {

    log.info("------------------------APILoginSuccessHandler------------------------");

    MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();

    Map<String, Object> claims = authTokenService.issueLoginTokens(memberDTO, request, response);

    String jsonStr = new Gson().toJson(claims);

    response.setContentType("application/json; charset=UTF-8");

    PrintWriter printWriter = response.getWriter();
    printWriter.println(jsonStr);
    printWriter.close();
  }
}