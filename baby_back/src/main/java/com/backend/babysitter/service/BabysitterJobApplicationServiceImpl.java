package com.backend.babysitter.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.babysitter.domain.BabysitterJobApplication;
import com.backend.babysitter.domain.BabysitterJobApplicationStatus;
import com.backend.babysitter.domain.BabysitterJobPost;
import com.backend.babysitter.domain.BabysitterJobStatus;
import com.backend.babysitter.domain.BabysitterProfile;
import com.backend.babysitter.dto.BabysitterJobApplicationDTO;
import com.backend.babysitter.mapper.BabysitterJobApplicationMapper;
import com.backend.babysitter.mapper.BabysitterJobPostMapper;
import com.backend.babysitter.mapper.BabysitterProfileMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class BabysitterJobApplicationServiceImpl implements BabysitterJobApplicationService {

    private final BabysitterJobApplicationMapper babysitterJobApplicationMapper;

    private final BabysitterJobPostMapper babysitterJobPostMapper;

    private final BabysitterProfileMapper babysitterProfileMapper;

    @Override
    public Long apply(Long jobNo, String sitterEmail, String message) {

        BabysitterJobPost jobPost = Optional.ofNullable(babysitterJobPostMapper.selectByJobNo(jobNo))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 구인글입니다."));

        if (jobPost.getStatus() != BabysitterJobStatus.OPEN) {
            throw new IllegalStateException("이미 마감되었거나 취소된 구인글입니다.");
        }

        if (jobPost.getParentEmail().equals(sitterEmail)) {
            throw new IllegalArgumentException("본인이 등록한 구인글에는 지원할 수 없습니다.");
        }

        if (babysitterProfileMapper.selectByEmail(sitterEmail) == null) {
            throw new NoSuchElementException("등록된 시터 프로필이 없습니다.");
        }

        if (babysitterJobApplicationMapper.selectOne(jobNo, sitterEmail) != null) {
            throw new IllegalStateException("이미 지원한 구인글입니다.");
        }

        BabysitterJobApplication application = BabysitterJobApplication.builder()
            .jobNo(jobNo)
            .sitterEmail(sitterEmail)
            .message(message)
            .status(BabysitterJobApplicationStatus.PENDING)
            .build();

        babysitterJobApplicationMapper.insert(application);

        return application.getApplicationNo();
    }

    @Override
    public List<BabysitterJobApplicationDTO> listByJob(Long jobNo, String parentEmail) {

        BabysitterJobPost jobPost = Optional.ofNullable(babysitterJobPostMapper.selectByJobNo(jobNo))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 구인글입니다."));

        if (!jobPost.getParentEmail().equals(parentEmail)) {
            throw new AccessDeniedException("본인이 등록한 구인글의 지원자만 볼 수 있습니다.");
        }

        return babysitterJobApplicationMapper.selectListByJob(jobNo)
            .stream()
            .map(a -> toDTO(a, jobPost.getTitle()))
            .collect(Collectors.toList());
    }

    @Override
    public List<BabysitterJobApplicationDTO> listBySitter(String sitterEmail) {

        return babysitterJobApplicationMapper.selectListBySitter(sitterEmail)
            .stream()
            .map(a -> {
                String jobTitle = Optional.ofNullable(babysitterJobPostMapper.selectByJobNo(a.getJobNo()))
                    .map(BabysitterJobPost::getTitle)
                    .orElse(null);
                return toDTO(a, jobTitle);
            })
            .collect(Collectors.toList());
    }

    @Override
    public void accept(Long applicationNo, String parentEmail) {

        BabysitterJobApplication application = findOwnedByParentOrThrow(applicationNo, parentEmail);

        requirePending(application);

        babysitterJobApplicationMapper.updateStatus(applicationNo, BabysitterJobApplicationStatus.ACCEPTED);
        babysitterJobApplicationMapper.rejectOtherPending(application.getJobNo(), applicationNo);
        babysitterJobPostMapper.updateStatus(application.getJobNo(), BabysitterJobStatus.CLOSED);
    }

    @Override
    public void reject(Long applicationNo, String parentEmail) {

        BabysitterJobApplication application = findOwnedByParentOrThrow(applicationNo, parentEmail);

        requirePending(application);

        babysitterJobApplicationMapper.updateStatus(applicationNo, BabysitterJobApplicationStatus.REJECTED);
    }

    @Override
    public void cancel(Long applicationNo, String sitterEmail) {

        BabysitterJobApplication application = Optional.ofNullable(
                babysitterJobApplicationMapper.selectByApplicationNo(applicationNo))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 지원입니다."));

        if (!application.getSitterEmail().equals(sitterEmail)) {
            throw new AccessDeniedException("본인이 지원한 내역만 취소할 수 있습니다.");
        }

        requirePending(application);

        babysitterJobApplicationMapper.updateStatus(applicationNo, BabysitterJobApplicationStatus.CANCELED);
    }

    private BabysitterJobApplication findOwnedByParentOrThrow(Long applicationNo, String parentEmail) {

        BabysitterJobApplication application = Optional.ofNullable(
                babysitterJobApplicationMapper.selectByApplicationNo(applicationNo))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 지원입니다."));

        BabysitterJobPost jobPost = Optional.ofNullable(
                babysitterJobPostMapper.selectByJobNo(application.getJobNo()))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 구인글입니다."));

        if (!jobPost.getParentEmail().equals(parentEmail)) {
            throw new AccessDeniedException("본인이 등록한 구인글의 지원만 처리할 수 있습니다.");
        }

        return application;
    }

    private void requirePending(BabysitterJobApplication application) {

        if (application.getStatus() != BabysitterJobApplicationStatus.PENDING) {
            throw new IllegalStateException("이미 처리된 지원입니다.");
        }
    }

    private BabysitterJobApplicationDTO toDTO(BabysitterJobApplication application, String jobTitle) {

        String sitterName = Optional.ofNullable(babysitterProfileMapper.selectByEmail(application.getSitterEmail()))
            .map(BabysitterProfile::getName)
            .orElse(null);

        return BabysitterJobApplicationDTO.builder()
            .applicationNo(application.getApplicationNo())
            .jobNo(application.getJobNo())
            .jobTitle(jobTitle)
            .sitterEmail(application.getSitterEmail())
            .sitterName(sitterName)
            .message(application.getMessage())
            .status(application.getStatus())
            .regTime(application.getRegTime())
            .modTime(application.getModTime())
            .build();
    }
}
