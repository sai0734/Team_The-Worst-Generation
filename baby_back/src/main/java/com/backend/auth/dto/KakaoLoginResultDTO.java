package com.backend.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KakaoLoginResultDTO {

  private String status;

  private String email;

  private String socialLinkToken;

  private MemberDTO memberDTO;

  public static KakaoLoginResultDTO login(MemberDTO memberDTO) {
    return KakaoLoginResultDTO.builder()
        .status("LOGIN")
        .email(memberDTO.getEmail())
        .memberDTO(memberDTO)
        .build();
  }

  public static KakaoLoginResultDTO needSignup(String email, String socialLinkToken) {
    return KakaoLoginResultDTO.builder()
        .status("NEED_SIGNUP")
        .email(email)
        .socialLinkToken(socialLinkToken)
        .build();
  }

  public static KakaoLoginResultDTO needAccountAuth(String email, String socialLinkToken) {
    return KakaoLoginResultDTO.builder()
        .status("NEED_ACCOUNT_AUTH")
        .email(email)
        .socialLinkToken(socialLinkToken)
        .build();
  }
}



