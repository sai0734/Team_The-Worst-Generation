package com.backend.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.domain.Product;
import com.backend.domain.ProductImage;
import com.backend.dto.PageRequestDTO;
import com.backend.dto.PageResponseDTO;
import com.backend.dto.ProductDTO;
import com.backend.mapper.ProductMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService{

  private final ProductMapper productMapper;

  @Override
  public PageResponseDTO<ProductDTO> getList(PageRequestDTO pageRequestDTO) {

    log.info("getList..............");

    int skip = (pageRequestDTO.getPage() - 1) * pageRequestDTO.getSize(); //페이지 시작 번호가 0부터 시작하므로

    List<Product> result = productMapper.selectList(skip, pageRequestDTO.getSize());

    List<ProductDTO> dtoList = result.stream().map(product -> {

      ProductDTO productDTO = ProductDTO.builder()
      .pno(product.getPno())
      .pname(product.getPname())
      .pdesc(product.getPdesc())
      .price(product.getPrice())
.delFlag(product.isDelFlag())
      .build();

      String imageStr = product.getImageList().get(0).getFileName();
      productDTO.setUploadFileNames(List.of(imageStr));

      return productDTO;
    }).collect(Collectors.toList());

    long totalCount = productMapper.selectListCount();

    return PageResponseDTO.<ProductDTO>withAll()
                .dtoList(dtoList)
                .totalCount(totalCount)
                .pageRequestDTO(pageRequestDTO)
                .build();
  }

 @Override
  public Long register(ProductDTO productDTO) {

    Product product = dtoToEntity(productDTO);

    productMapper.insert(product);

    product.getImageList().forEach(image -> productMapper.insertImage(product.getPno(), image));

    return product.getPno();
  }

  private Product dtoToEntity(ProductDTO productDTO){

    Product product = Product.builder()
    .pno(productDTO.getPno())
    .pname(productDTO.getPname())
    .pdesc(productDTO.getPdesc())
    .price(productDTO.getPrice())
    .build();

    //업로드 처리가 끝난 파일들의 이름 리스트
    List<String> uploadFileNames = productDTO.getUploadFileNames();

    if(uploadFileNames == null){
      return product;
    }

    uploadFileNames.stream().forEach(uploadName -> {

      product.addImageString(uploadName);
    });

    return product;
  }

   @Override
  public ProductDTO get(Long pno) {

    Product product = Optional.ofNullable(productMapper.selectOne(pno)).orElseThrow();

    ProductDTO productDTO = entityToDTO(product);

    return productDTO;

  }

  private ProductDTO entityToDTO(Product product){

    ProductDTO productDTO = ProductDTO.builder()
    .pno(product.getPno())
    .pname(product.getPname())
    .pdesc(product.getPdesc())
    .price(product.getPrice())
    .build();

    List<ProductImage> imageList = product.getImageList();

    if(imageList == null || imageList.size() == 0 ){
      return productDTO;
    }

    List<String> fileNameList = imageList.stream().map(productImage ->
      productImage.getFileName()).toList();

    productDTO.setUploadFileNames(fileNameList);

    return productDTO;
  }

    @Override
  public void modify(ProductDTO productDTO) {
    //step1 read
    Product product = Optional.ofNullable(productMapper.selectOne(productDTO.getPno())).orElseThrow();

    //2. change pname, pdesc, price
    product.changeName(productDTO.getPname());
    product.changeDesc(productDTO.getPdesc());
    product.changePrice(productDTO.getPrice());

    //3. upload File -- clear first
    product.clearList();

    List<String> uploadFileNames = productDTO.getUploadFileNames();

    if(uploadFileNames != null && uploadFileNames.size() > 0 ){
      uploadFileNames.stream().forEach(uploadName -> {
        product.addImageString(uploadName);
      });
    }

    productMapper.update(product);
    productMapper.deleteImages(product.getPno());
    product.getImageList().forEach(image -> productMapper.insertImage(product.getPno(), image));
  }

    @Override
  public void remove(Long pno) {

    productMapper.updateToDelete(pno, true);

  }

}
