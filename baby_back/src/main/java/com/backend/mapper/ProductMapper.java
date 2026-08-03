package com.backend.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.backend.domain.Product;
import com.backend.domain.ProductImage;

public interface ProductMapper {

  // 목록: 삭제되지 않았고 ord=0인 이미지가 있는 상품 (기존 JPA 쿼리와 동일한 조건)
  List<Product> selectList(@Param("skip") int skip, @Param("size") int size);

  long selectListCount();

  // 단건 조회: 이미지 목록 포함
  Product selectOne(@Param("pno") Long pno);

  void insert(Product product);

  void insertImage(@Param("pno") Long pno, @Param("image") ProductImage image);

  void deleteImages(@Param("pno") Long pno);

  void update(Product product);

  void updateToDelete(@Param("pno") Long pno, @Param("flag") boolean flag);

}
