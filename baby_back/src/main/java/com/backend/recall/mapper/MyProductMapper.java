package com.backend.recall.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.recall.domain.MyProduct;

@Mapper
public interface MyProductMapper {

    void insert(MyProduct product);

    MyProduct selectOne(@Param("productNo") Long productNo);

    List<MyProduct> selectByMember(@Param("memberEmail") String memberEmail);

    List<MyProduct> selectUnmatched();

    void updateRecallMatch(MyProduct product);

    void delete(@Param("productNo") Long productNo);
}