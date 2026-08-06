package com.backend.market.service;

import com.backend.market.domain.MarketProfile;
import com.backend.market.domain.Review;
import com.backend.market.dto.ReviewDTO;
import com.backend.market.mapper.MarketProfileMapper;
import com.backend.market.mapper.ReviewMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewMapper reviewMapper;

    private final MarketProfileMapper marketProfileMapper;

    private final ModelMapper modelMapper;

    @Override
    public List<ReviewDTO> getListByTarget(String targetEmail) {

        List<Review> result = reviewMapper.selectListByTarget(targetEmail);

        return result.stream()
                .map(review -> modelMapper.map(review, ReviewDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public Long register(ReviewDTO dto) {

        Review review = modelMapper.map(dto, Review.class);

        reviewMapper.insert(review);

        applyMannerTempChange(dto.getTargetEmail(), dto.getRating());

        return review.getReviewNo();
    }

    // 매너온도 계산식: 최초 36.5도에서 시작(MarketProfile 기본값), 후기 하나 등록될 때마다
    // 그 후기의 평점(1~5점)이 3점에서 벗어난 만큼 1점당 0.5도씩 "현재 온도에 누적"으로 가감.
    // (5점=+1.0, 4점=+0.5, 3점=0, 2점=-0.5, 1점=-1.0)
    private void applyMannerTempChange(String targetEmail, int rating) {

        MarketProfile profile = marketProfileMapper.selectByEmail(targetEmail);

        if (profile == null) {
            profile = MarketProfile.builder().email(targetEmail).build();
            marketProfileMapper.insert(profile);
        }

        BigDecimal delta = BigDecimal.valueOf((rating - 3) * 0.5);
        BigDecimal newTemp = profile.getMannerTemp().add(delta);

        profile.changeMannerTemp(newTemp);

        marketProfileMapper.update(profile);
    }
}
