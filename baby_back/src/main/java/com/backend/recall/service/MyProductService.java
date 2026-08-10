package com.backend.recall.service;

import java.util.List;

import com.backend.recall.dto.MyProductDTO;

public interface MyProductService {

    MyProductDTO register(String memberEmail, MyProductDTO dto);

    List<MyProductDTO> listMine(String memberEmail);

    void remove(Long productNo, String memberEmail);

    void recheckAll();
}