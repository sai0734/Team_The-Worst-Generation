package com.backend.mapper;

import org.apache.ibatis.annotations.Param;

import com.backend.domain.Cart;

public interface CartMapper {

  // 회원 이메일로 장바구니 조회 (JPA의 getCartOfMember()를 대체)
  Cart selectByEmail(@Param("email") String email);

  void insert(Cart cart);

}
