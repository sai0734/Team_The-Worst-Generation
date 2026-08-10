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
import com.backend.babysitter.domain.BabysitterJobPost;
import com.backend.babysitter.domain.BabysitterJobStatus;
import com.backend.babysitter.dto.BabysitterJobPostDTO;
import com.backend.babysitter.dto.BabysitterJobSearchDTO;
import com.backend.babysitter.mapper.BabysitterJobApplicationMapper;
import com.backend.babysitter.mapper.BabysitterJobPostMapper;
import com.backend.global.dto.PageResponseDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class BabysitterJobPostServiceImpl implements BabysitterJobPostService {

    private final BabysitterJobPostMapper babysitterJobPostMapper;

    private final BabysitterJobApplicationMapper babysitterJobApplicationMapper;

    private final MemberMapper memberMapper;

    @Override
    public Long register(BabysitterJobPostDTO jobPostDTO) {

        BabysitterJobPost jobPost = BabysitterJobPost.builder()
            .parentEmail(jobPostDTO.getParentEmail())
            .title(jobPostDTO.getTitle())
            .region(jobPostDTO.getRegion())
            .desiredDate(jobPostDTO.getDesiredDate())
            .timeSlot(jobPostDTO.getTimeSlot())
            .hourlyRate(jobPostDTO.getHourlyRate())
            .message(jobPostDTO.getMessage())
            .status(BabysitterJobStatus.OPEN)
            .build();

        babysitterJobPostMapper.insert(jobPost);

        return jobPost.getJobNo();
    }

    @Override
    public BabysitterJobPostDTO get(Long jobNo) {

        BabysitterJobPost jobPost = findOrThrow(jobNo);

        return toDTO(jobPost);
    }

    @Override
    public PageResponseDTO<BabysitterJobPostDTO> getList(BabysitterJobSearchDTO searchDTO) {

        int skip = (searchDTO.getPage() - 1) * searchDTO.getSize();

        List<BabysitterJobPostDTO> dtoList = babysitterJobPostMapper.selectList(searchDTO, skip)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());

        long totalCount = babysitterJobPostMapper.selectListCount(searchDTO);

        return PageResponseDTO.<BabysitterJobPostDTO>withAll()
            .dtoList(dtoList)
            .totalCount(totalCount)
            .pageRequestDTO(searchDTO)
            .build();
    }

    @Override
    public List<BabysitterJobPostDTO> getMyJobPosts(String parentEmail) {

        return babysitterJobPostMapper.selectListByParent(parentEmail)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    public void cancel(Long jobNo, String parentEmail) {

        BabysitterJobPost jobPost = findOrThrow(jobNo);

        if (!jobPost.getParentEmail().equals(parentEmail)) {
            throw new AccessDeniedException("본인이 등록한 구인글만 취소할 수 있습니다.");
        }

        if (jobPost.getStatus() != BabysitterJobStatus.OPEN) {
            throw new IllegalStateException("이미 마감되었거나 취소된 구인글입니다.");
        }

        babysitterJobPostMapper.updateStatus(jobNo, BabysitterJobStatus.CANCELED);
    }

    private BabysitterJobPost findOrThrow(Long jobNo) {

        return Optional.ofNullable(babysitterJobPostMapper.selectByJobNo(jobNo))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 구인글입니다."));
    }

    private BabysitterJobPostDTO toDTO(BabysitterJobPost jobPost) {

        String parentNickname = Optional.ofNullable(memberMapper.selectByEmail(jobPost.getParentEmail()))
            .map(Member::getNickname)
            .orElse(null);

        long applicationCount = babysitterJobApplicationMapper.countByJob(jobPost.getJobNo());

        return BabysitterJobPostDTO.builder()
            .jobNo(jobPost.getJobNo())
            .parentEmail(jobPost.getParentEmail())
            .parentNickname(parentNickname)
            .title(jobPost.getTitle())
            .region(jobPost.getRegion())
            .desiredDate(jobPost.getDesiredDate())
            .timeSlot(jobPost.getTimeSlot())
            .hourlyRate(jobPost.getHourlyRate())
            .message(jobPost.getMessage())
            .status(jobPost.getStatus())
            .applicationCount(applicationCount)
            .regTime(jobPost.getRegTime())
            .modTime(jobPost.getModTime())
            .build();
    }
}
