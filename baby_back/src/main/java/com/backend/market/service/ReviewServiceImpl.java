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

        recalcMannerTemp(dto.getTargetEmail());

        return review.getReviewNo();
    }

    // TODO: 정확한 매너온도 계산식은 기획 확정 필요. 지금은 임시로 평균점수
    private void recalcMannerTemp(String targetEmail) {

        Double avgRating = reviewMapper.selectAvgRatingByTarget(targetEmail);

        if (avgRating == null) {
            return;
        }

        MarketProfile profile = marketProfileMapper.selectByEmail(targetEmail);

        if (profile == null) {
            profile = MarketProfile.builder().email(targetEmail).build();
            marketProfileMapper.insert(profile);
        }

        BigDecimal newTemp = new BigDecimal("36.5").add(BigDecimal.valueOf(avgRating - 3));

        profile.changeMannerTemp(newTemp);

        marketProfileMapper.update(profile);
    }
}
