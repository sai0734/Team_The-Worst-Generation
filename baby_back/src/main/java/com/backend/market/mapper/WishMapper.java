package com.backend.market.mapper;

import com.backend.market.domain.Wish;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WishMapper {

    // "내 동그라미" - 내가 찜한 매물 목록
    List<Wish> selectListByMember(@Param("memberEmail") String memberEmail);

    Wish selectOne(@Param("itemNo") Long itemNo, @Param("memberEmail") String memberEmail);

    long countByItemNo(@Param("itemNo") Long itemNo);

    void insert(Wish wish);

    void delete(@Param("itemNo") Long itemNo, @Param("memberEmail") String memberEmail);

}
