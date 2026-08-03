package com.backend.mapper;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import com.backend.domain.Cart;
import com.backend.domain.CartItem;
import com.backend.domain.Member;
import com.backend.domain.Product;
import com.backend.dto.CartItemListDTO;

import lombok.extern.log4j.Log4j2;

@SpringBootTest
@Log4j2
public class CartMapperTests {

  @Autowired
  private CartMapper cartMapper;

  @Autowired
  private CartItemMapper cartItemMapper;

  @Transactional
  @Commit
  @Test
  public void testInsertByProduct() {

    log.info("test1-----------------------");

    // 사용자가 전송하는 정보
    String email = "user1@aaa.com";
    Long pno = 5L;
    int qty = 2;

    // 만일 기존에 사용자의 장바구니 아이템이 있었다면
    CartItem cartItem = cartItemMapper.selectByEmailAndPno(email, pno);

    if (cartItem != null) {
      cartItem.changeQty(qty);
      cartItemMapper.updateQty(cartItem.getCino(), qty);

      return;
    }

    // 장바구니 아이템이 없었다면 장바구니부터 확인 필요

    // 사용자가 장바구니를 만든적이 있는지 확인
    Cart cart = cartMapper.selectByEmail(email);

    // 사용자의 장바구니가 존재하지 않으면 장바구니 생성
    if (cart == null) {

      log.info("MemberCart is not exist!!");

      Member member = Member.builder().email(email).build();

      cart = Cart.builder().owner(member).build();

      cartMapper.insert(cart);
    }

    log.info(cart);

    // -------------------------------------------------------------

    Product product = Product.builder().pno(pno).build();
    cartItem = CartItem.builder().product(product).cart(cart).qty(qty).build();

    // 상품 아이템 저장
    cartItemMapper.insert(cartItem);
  }

  @Test
  @Commit
  public void testUpdateByCino() {

    Long cino = 1L;
    int qty = 4;

    CartItem cartItem = cartItemMapper.selectOne(cino);
    cartItem.changeQty(qty);
    cartItemMapper.updateQty(cartItem.getCino(), cartItem.getQty());
  }

  @Test
  public void testListOfMember() {

    String email = "user1@aaa.com";

    List<CartItemListDTO> cartItemList = cartItemMapper.selectListByEmail(email);

    for (CartItemListDTO dto : cartItemList) {
      log.info(dto);
    }
  }

  @Test
  public void testDeleteThenList() {

    Long cino = 1L;

    // 장바구니 번호
    Long cno = cartItemMapper.selectCnoByCino(cino);

    // 삭제는 임시로 주석처리
    cartItemMapper.deleteById(cino);

    // 목록
    List<CartItemListDTO> cartItemList = cartItemMapper.selectListByCno(cno);

    for (CartItemListDTO dto : cartItemList) {
      log.info(dto);
    }
  }
}
