package com.backend.service;

import org.springframework.transaction.annotation.Transactional;

import com.backend.dto.PageRequestDTO;
import com.backend.dto.PageResponseDTO;
import com.backend.dto.ProductDTO;

@Transactional
public interface ProductService {
    PageResponseDTO<ProductDTO> getList(PageRequestDTO pageRequestDTO);
    Long register(ProductDTO productDTO);
    ProductDTO get(Long pno);
    void modify(ProductDTO productDTO);
    void remove(Long pno);
}