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
import com.backend.babysitter.domain.BabysitterProfile;
import com.backend.babysitter.domain.BabysitterRequest;
import com.backend.babysitter.domain.BabysitterRequestStatus;
import com.backend.babysitter.dto.BabysitterRequestDTO;
import com.backend.babysitter.mapper.BabysitterProfileMapper;
import com.backend.babysitter.mapper.BabysitterRequestMapper;
import com.backend.babysitter.mapper.BabysitterReviewMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class BabysitterRequestServiceImpl implements BabysitterRequestService {

    private final BabysitterRequestMapper babysitterRequestMapper;

    private final BabysitterProfileMapper babysitterProfileMapper;

    private final MemberMapper memberMapper;

    private final BabysitterReviewMapper babysitterReviewMapper;

    @Override
    public Long register(BabysitterRequestDTO requestDTO) {

        if (requestDTO.getSitterEmail().equals(requestDTO.getParentEmail())) {
            throw new IllegalArgumentException("본인에게는 요청할 수 없습니다.");
        }

        if (babysitterProfileMapper.selectByEmail(requestDTO.getSitterEmail()) == null) {
            throw new NoSuchElementException("등록된 시터 프로필이 없습니다.");
        }

        BabysitterRequest request = BabysitterRequest.builder()
            .sitterEmail(requestDTO.getSitterEmail())
            .parentEmail(requestDTO.getParentEmail())
            .requestDate(requestDTO.getRequestDate())
            .timeSlot(requestDTO.getTimeSlot())
            .message(requestDTO.getMessage())
            .status(BabysitterRequestStatus.PENDING)
            .build();

        babysitterRequestMapper.insert(request);

        return request.getRequestNo();
    }

    @Override
    public List<BabysitterRequestDTO> listReceived(String sitterEmail) {

        return babysitterRequestMapper.selectListBySitter(sitterEmail)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    public List<BabysitterRequestDTO> listSent(String parentEmail) {

        return babysitterRequestMapper.selectListByParent(parentEmail)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    public void accept(Long requestNo, String sitterEmail) {

        BabysitterRequest request = findOwnedBySitterOrThrow(requestNo, sitterEmail);

        requirePending(request);

        babysitterRequestMapper.updateStatus(requestNo, BabysitterRequestStatus.ACCEPTED);
    }

    @Override
    public void reject(Long requestNo, String sitterEmail) {

        BabysitterRequest request = findOwnedBySitterOrThrow(requestNo, sitterEmail);

        requirePending(request);

        babysitterRequestMapper.updateStatus(requestNo, BabysitterRequestStatus.REJECTED);
    }

    @Override
    public void cancel(Long requestNo, String parentEmail) {

        BabysitterRequest request = Optional.ofNullable(babysitterRequestMapper.selectByRequestNo(requestNo))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 요청입니다."));

        if (!request.getParentEmail().equals(parentEmail)) {
            throw new AccessDeniedException("본인이 보낸 요청만 취소할 수 있습니다.");
        }

        requirePending(request);

        babysitterRequestMapper.updateStatus(requestNo, BabysitterRequestStatus.CANCELED);
    }

    private BabysitterRequest findOwnedBySitterOrThrow(Long requestNo, String sitterEmail) {

        BabysitterRequest request = Optional.ofNullable(babysitterRequestMapper.selectByRequestNo(requestNo))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 요청입니다."));

        if (!request.getSitterEmail().equals(sitterEmail)) {
            throw new AccessDeniedException("본인에게 온 요청만 처리할 수 있습니다.");
        }

        return request;
    }

    private void requirePending(BabysitterRequest request) {

        if (request.getStatus() != BabysitterRequestStatus.PENDING) {
            throw new IllegalStateException("이미 처리된 요청입니다.");
        }
    }

    private BabysitterRequestDTO toDTO(BabysitterRequest request) {

        String sitterName = Optional.ofNullable(babysitterProfileMapper.selectByEmail(request.getSitterEmail()))
            .map(BabysitterProfile::getName)
            .orElse(null);

        String parentNickname = Optional.ofNullable(memberMapper.selectByEmail(request.getParentEmail()))
            .map(Member::getNickname)
            .orElse(null);

        boolean reviewed = babysitterReviewMapper.selectByRequestNo(request.getRequestNo()) != null;

        return BabysitterRequestDTO.builder()
            .requestNo(request.getRequestNo())
            .sitterEmail(request.getSitterEmail())
            .sitterName(sitterName)
            .parentEmail(request.getParentEmail())
            .parentNickname(parentNickname)
            .requestDate(request.getRequestDate())
            .timeSlot(request.getTimeSlot())
            .message(request.getMessage())
            .status(request.getStatus())
            .reviewed(reviewed)
            .regTime(request.getRegTime())
            .modTime(request.getModTime())
            .build();
    }
}
