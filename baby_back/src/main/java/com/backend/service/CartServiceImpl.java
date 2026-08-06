package com.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.domain.Cart;
import com.backend.domain.CartItem;
import com.backend.auth.domain.Member;
import com.backend.domain.Product;
import com.backend.dto.CartItemDTO;
import com.backend.dto.CartItemListDTO;
import com.backend.mapper.CartItemMapper;
import com.backend.mapper.CartMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RequiredArgsConstructor
@Service
@Log4j2
@Transactional
public class CartServiceImpl implements CartService {

  private final CartMapper cartMapper;

  private final CartItemMapper cartItemMapper;

  @Override
  public List<CartItemListDTO> addOrModify(CartItemDTO cartItemDTO) {

    String email = cartItemDTO.getEmail();

    Long pno = cartItemDTO.getPno();

    int qty = cartItemDTO.getQty();

    Long cino = cartItemDTO.getCino();

    log.info("======================================================");
    log.info(cartItemDTO.getCino() == null);

    if (cino != null) { // 장바구니 아이템 번호가 있어서 수량만 변경하는 경우

      CartItem cartItem = Optional.ofNullable(cartItemMapper.selectOne(cino)).orElseThrow();

      cartItem.changeQty(qty);

      cartItemMapper.updateQty(cartItem.getCino(), cartItem.getQty());

      return getCartItems(email);
    }

    // 장바구니 아이템 번호 cino가 없는 경우

    // 사용자의 카트
    Cart cart = getCart(email);

    // 이미 동일한 상품이 담긴적이 있을 수 있으므로
    CartItem cartItem = cartItemMapper.selectByEmailAndPno(email, pno);

    if (cartItem == null) {
      Product product = Product.builder().pno(pno).build();
      cartItem = CartItem.builder().product(product).cart(cart).qty(qty).build();

      // 상품 아이템 저장
      cartItemMapper.insert(cartItem);
    } else {
      cartItem.changeQty(qty);
      cartItemMapper.updateQty(cartItem.getCino(), cartItem.getQty());
    }

    return getCartItems(email);
  }

  // 사용자의 장바구니가 없었다면 새로운 장바구니를 생성하고 반환
  private Cart getCart(String email) {

    Cart cart = cartMapper.selectByEmail(email);

    if (cart == null) {

      log.info("Cart of the member is not exist!!");

      Member member = Member.builder().email(email).build();

      cart = Cart.builder().owner(member).build();

      cartMapper.insert(cart);
    }

    return cart;
  }

  @Override
  public List<CartItemListDTO> getCartItems(String email) {

    return cartItemMapper.selectListByEmail(email);
  }

  @Override
  public List<CartItemListDTO> remove(Long cino) {

    Long cno = cartItemMapper.selectCnoByCino(cino);

    log.info("cart no: " + cno);

    cartItemMapper.deleteById(cino);

    return cartItemMapper.selectListByCno(cno);
  }
}
