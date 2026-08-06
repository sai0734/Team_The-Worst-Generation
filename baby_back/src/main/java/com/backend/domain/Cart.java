package com.backend.domain;

import com.backend.auth.domain.Member;

import lombok.*;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString(exclude = "owner")
public class Cart {

  private Long cno;

  private Member owner;

}
