package com.backend.auth.domain;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class MemberSocial {

  private Long id;

  private String memberEmail;

  private String provider;

  private String providerId;

  private String providerEmail;

  private LocalDateTime connectedAt;
}



