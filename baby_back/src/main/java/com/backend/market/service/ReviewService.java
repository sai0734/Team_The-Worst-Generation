package com.backend.market.service;

import com.backend.market.dto.ReviewDTO;

import java.util.List;

public interface ReviewService {

    List<ReviewDTO> getListByTarget(String targetEmail);

    // 후기 등록 + target의 매너온도 재계산까지 처리
    Long register(ReviewDTO reviewDTO);
}
