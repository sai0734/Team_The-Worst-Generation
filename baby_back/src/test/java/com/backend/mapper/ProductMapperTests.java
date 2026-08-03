package com.backend.mapper;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import com.backend.domain.Product;

import lombok.extern.log4j.Log4j2;

@SpringBootTest
@Log4j2
public class ProductMapperTests {

  @Autowired
  ProductMapper productMapper;

  @Test
  public void testInsert() {

    for (int i = 0; i < 10; i++) {

      Product product = Product.builder()
      .pname("상품"+i)
      .price(100*i)
      .pdesc("상품설명 " + i)
      .build();

      //2개의 이미지 파일 추가
      product.addImageString("IMAGE1.jpg");
      product.addImageString("IMAGE2.jpg");

      productMapper.insert(product);
      product.getImageList().forEach(image -> productMapper.insertImage(product.getPno(), image));

      log.info("-------------------");
    }
  }

    @Commit
    @Transactional
    @Test
    public void testDelte() {

        Long pno = 2L;

        productMapper.updateToDelete(pno, true);

  }

   @Test
  public void testUpdate(){

    Long pno = 10L;

    Product product = productMapper.selectOne(pno);

    product.changeName("10번 상품");
    product.changeDesc("10번 상품 설명입니다.");
    product.changePrice(5000);

    //첨부파일 수정
    product.clearList();

    product.addImageString(UUID.randomUUID().toString()+"_"+"NEWIMAGE1.jpg");
    product.addImageString(UUID.randomUUID().toString()+"_"+"NEWIMAGE2.jpg");
    product.addImageString(UUID.randomUUID().toString()+"_"+"NEWIMAGE3.jpg");

    productMapper.update(product);
    productMapper.deleteImages(pno);
    product.getImageList().forEach(image -> productMapper.insertImage(pno, image));

  }
}
