package com.backend.domain;

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
