package com.backend.market.mapper;

import com.backend.market.domain.MarketItem;
import com.backend.market.domain.MarketItemImage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MarketItemMapper {

    // 목록 (페이징만, 카테고리/지역 등 필터는 필요해지면 파라미터 추가)
    List<MarketItem> selectList(@Param("skip") int skip, @Param("size") int size);

    long selectListCount();

    // 단건 조회: 이미지 목록 포함
    MarketItem selectOne(@Param("itemNo") Long itemNo);

    // 지도 (내 주변) 후보군: 좌표가 있고 거래 가능 상태인 매물 전체. 거레 계산/반경 필터는 서비스단에서 처리
    List<MarketItem> selectNearbyCandidates();

    // 내 매물: 판매자 본인이 등록한 매물 전체 (삭제된 매물 제외), 최신순
    List<MarketItem> selectListBySeller(@Param("sellerEmail") String sellerEmail);

    void insert(MarketItem item);

    void insertImage(@Param("itemNo") Long itemNo, @Param("image") MarketItemImage image);

    void deleteImages(@Param("itemNo") Long itemNo);

    void update(MarketItem item);

    void updateToDelete(@Param("itemNo") Long itemNo, @Param("flag") boolean flag);

    void increaseViewCount(@Param("itemNo") Long itemNo);

    void bump(@Param("itemNo") Long itemNo);

}
