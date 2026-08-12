package com.backend.auth.dto;

import lombok.Data;

@Data
public class MemberSignupRequestDTO {

  private String email;

  private String pw;

  private String nickname;
}
