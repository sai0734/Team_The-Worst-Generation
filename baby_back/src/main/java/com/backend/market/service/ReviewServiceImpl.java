package com.backend.market.service;

import com.backend.market.domain.ChatRoom;
import com.backend.market.domain.MarketItem;
import com.backend.market.domain.MarketProfile;
import com.backend.market.domain.Review;
import com.backend.market.dto.ReviewDTO;
import com.backend.market.mapper.ChatRoomMapper;
import com.backend.market.mapper.MarketItemMapper;
import com.backend.market.mapper.MarketProfileMapper;
import com.backend.market.mapper.ReviewMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private static final BigDecimal MIN_DELTA = new BigDecimal("-1.0");
    private static final BigDecimal MAX_DELTA = new BigDecimal("1.0");

    private final ReviewMapper reviewMapper;

    private final MarketProfileMapper marketProfileMapper;

    private final ChatRoomMapper chatRoomMapper;

    private final MarketItemMapper marketItemMapper;

    private final ModelMapper modelMapper;

    @Override
    public List<ReviewDTO> getListByTarget(String targetEmail) {

        List<Review> result = reviewMapper.selectListByTarget(targetEmail);

        return result.stream()
                .map(review -> modelMapper.map(review, ReviewDTO.class))
                .collect(Collectors.toList());
    }

    // 거래완료된 채팅방 1건당 온도 평가 1건. targetEmail/itemNo는 클라이언트 값을 안 믿고
    // 채팅방에서 그대로 가져옴 (구매자가 아무 이메일에나 평가를 꽂아넣지 못하게).
    @Override
    public Long register(ReviewDTO dto) {

        if (dto.getRoomNo() == null) {
            throw new IllegalArgumentException("채팅방 정보가 없습니다.");
        }

        BigDecimal tempDelta = dto.getTempDelta();
        if (tempDelta == null) {
            throw new IllegalArgumentException("온도 조정 값이 없습니다.");
        }
        if (tempDelta.compareTo(MIN_DELTA) < 0 || tempDelta.compareTo(MAX_DELTA) > 0) {
            throw new IllegalArgumentException("온도 조정 값은 -1.0 ~ +1.0 사이여야 합니다.");
        }

        ChatRoom room = Optional.ofNullable(chatRoomMapper.selectOne(dto.getRoomNo()))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다: " + dto.getRoomNo()));

        if (!room.getBuyerEmail().equals(dto.getWriterEmail())) {
            throw new AccessDeniedException("구매자만 온도 평가를 남길 수 있습니다.");
        }

        MarketItem item = Optional.ofNullable(marketItemMapper.selectOne(room.getItemNo()))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매물입니다: " + room.getItemNo()));

        if (!"거래완료".equals(item.getStatus())) {
            throw new IllegalStateException("거래완료된 채팅방에서만 온도 평가를 남길 수 있습니다.");
        }

        if (reviewMapper.countByRoom(dto.getRoomNo()) > 0) {
            throw new IllegalStateException("이미 이 거래에 대한 평가를 남겼습니다.");
        }

        dto.setItemNo(room.getItemNo());
        dto.setTargetEmail(room.getSellerEmail());

        Review review = modelMapper.map(dto, Review.class);

        reviewMapper.insert(review);

        applyMannerTempChange(dto.getTargetEmail(), tempDelta);

        return review.getReviewNo();
    }

    private void applyMannerTempChange(String targetEmail, BigDecimal tempDelta) {

        MarketProfile profile = marketProfileMapper.selectByEmail(targetEmail);

        if (profile == null) {
            profile = MarketProfile.builder().email(targetEmail).build();
            marketProfileMapper.insert(profile);
        }

        BigDecimal newTemp = profile.getMannerTemp().add(tempDelta);

        profile.changeMannerTemp(newTemp);

        marketProfileMapper.update(profile);
    }
}
