package com.backend.domain;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@ToString(exclude = "imageList")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Product {

  private Long pno;

  private String pname;

  private int price;

  private String pdesc;

  private boolean delFlag;


  public void changeDel(boolean delFlag) {
    this.delFlag = delFlag;
  }


  @Builder.Default
  private List<ProductImage> imageList = new ArrayList<>();

  public void changePrice(int price) {
    this.price = price;
  }

  public void changeDesc(String desc){
      this.pdesc = desc;
  }

  public void changeName(String name){
      this.pname = name;
  }

  public void addImage(ProductImage image) {

      image.setOrd(this.imageList.size());
      imageList.add(image);
  }

  public void addImageString(String fileName){

    ProductImage productImage = ProductImage.builder()
    .fileName(fileName)
    .build();
    addImage(productImage);

  }

  public void clearList() {
      this.imageList.clear();
  }
}