package com.backend.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.domain.CartItem;
import com.backend.dto.CartItemListDTO;

@Mapper
public interface CartItemMapper {

  // cino로 단건 조회 (JPA의 findById()를 대체)
  CartItem selectOne(@Param("cino") Long cino);

  // 사용자의 장바구니에 특정 상품(pno)이 이미 담겨있는지 확인 (JPA의 getItemOfPno()를 대체)
  CartItem selectByEmailAndPno(@Param("email") String email, @Param("pno") Long pno);

  // 장바구니 아이템(cino)이 속한 장바구니 번호(cno) 조회 (JPA의 getCartFromItem()을 대체)
  Long selectCnoByCino(@Param("cino") Long cino);

  // 사용자 이메일 기준 장바구니 아이템 목록 (JPA의 getItemsOfCartDTOByEmail()을 대체)
  List<CartItemListDTO> selectListByEmail(@Param("email") String email);

  // 장바구니 번호(cno) 기준 장바구니 아이템 목록 (JPA의 getItemsOfCartDTOByCart()를 대체)
  List<CartItemListDTO> selectListByCno(@Param("cno") Long cno);

  void insert(CartItem cartItem);

  void updateQty(@Param("cino") Long cino, @Param("qty") int qty);

  void deleteById(@Param("cino") Long cino);

}
