package com.backend.babysitter.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.auth.domain.Member;
import com.backend.auth.mapper.MemberMapper;
import com.backend.babysitter.domain.BabysitterRequest;
import com.backend.babysitter.domain.BabysitterRequestStatus;
import com.backend.babysitter.domain.BabysitterReview;
import com.backend.babysitter.dto.BabysitterReviewDTO;
import com.backend.babysitter.mapper.BabysitterRequestMapper;
import com.backend.babysitter.mapper.BabysitterReviewMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class BabysitterReviewServiceImpl implements BabysitterReviewService {

    private final BabysitterReviewMapper babysitterReviewMapper;

    private final BabysitterRequestMapper babysitterRequestMapper;

    private final MemberMapper memberMapper;

    @Override
    public Long register(BabysitterReviewDTO reviewDTO, String writerEmail) {

        if (reviewDTO.getRating() < 1 || reviewDTO.getRating() > 5) {
            throw new IllegalArgumentException("평점은 1~5 사이여야 합니다.");
        }

        BabysitterRequest request = Optional.ofNullable(
                babysitterRequestMapper.selectByRequestNo(reviewDTO.getRequestNo()))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 요청입니다."));

        if (!request.getParentEmail().equals(writerEmail)) {
            throw new AccessDeniedException("본인이 요청한 건에만 후기를 남길 수 있습니다.");
        }

        if (request.getStatus() != BabysitterRequestStatus.ACCEPTED) {
            throw new IllegalStateException("수락된 요청에만 후기를 남길 수 있습니다.");
        }

        if (babysitterReviewMapper.selectByRequestNo(reviewDTO.getRequestNo()) != null) {
            throw new IllegalStateException("이미 후기를 작성했습니다.");
        }

        BabysitterReview review = BabysitterReview.builder()
            .requestNo(request.getRequestNo())
            .sitterEmail(request.getSitterEmail())
            .writerEmail(writerEmail)
            .rating(reviewDTO.getRating())
            .content(reviewDTO.getContent())
            .build();

        babysitterReviewMapper.insert(review);

        return review.getReviewNo();
    }

    @Override
    public List<BabysitterReviewDTO> listBySitter(String sitterEmail) {

        return babysitterReviewMapper.selectListBySitter(sitterEmail)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    private BabysitterReviewDTO toDTO(BabysitterReview review) {

        String writerNickname = Optional.ofNullable(memberMapper.selectByEmail(review.getWriterEmail()))
            .map(Member::getNickname)
            .orElse(null);

        return BabysitterReviewDTO.builder()
            .reviewNo(review.getReviewNo())
            .requestNo(review.getRequestNo())
            .sitterEmail(review.getSitterEmail())
            .writerNickname(writerNickname)
            .rating(review.getRating())
            .content(review.getContent())
            .regTime(review.getRegTime())
            .build();
    }
}
