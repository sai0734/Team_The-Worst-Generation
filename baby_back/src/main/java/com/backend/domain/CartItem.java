package com.backend.domain;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Builder
@ToString(exclude = "cart")
public class CartItem {

  private Long cino;

  private Product product;

  private Cart cart;

  private int qty;

  public void changeQty(int qty) {
    this.qty = qty;
  }

}
