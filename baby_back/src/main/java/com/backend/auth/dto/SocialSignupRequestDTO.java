package com.backend.auth.dto;

import lombok.Data;

@Data
public class SocialSignupRequestDTO {

  private String email;

  private String pw;

  private String nickname;

  private String socialLinkToken;
}
