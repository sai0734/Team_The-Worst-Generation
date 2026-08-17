package com.backend.market.mapper;

import com.backend.market.domain.Review;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReviewMapper {

    // "받은 후기" 목록
    List<Review> selectListByTarget(@Param("targetEmail") String targetEmail);

    // 매너온도 계산용 평균 평점
    Double selectAvgRatingByTarget(@Param("targetEmail") String targetEmail);

    void insert(Review review);

    // 이 채팅방(거래)에 이미 온도 평가를 남겼는지 - 중복 방지
    int countByRoom(@Param("roomNo") Long roomNo);

}
