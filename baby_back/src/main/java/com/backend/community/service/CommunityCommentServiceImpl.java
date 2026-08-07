package com.backend.community.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.backend.auth.mapper.MemberMapper;
import com.backend.community.domain.CommunityComment;
import com.backend.community.domain.CommunityCommentImage;
import com.backend.community.dto.CommunityCommentDTO;
import com.backend.community.dto.CommunityImageDTO;
import com.backend.community.mapper.CommunityCommentMapper;
import com.backend.community.mapper.CommunityPostMapper;
import com.backend.global.util.CustomFileUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class CommunityCommentServiceImpl implements CommunityCommentService {

    private final CommunityCommentMapper communityCommentMapper;

    private final CommunityPostMapper communityPostMapper;

    private final MemberMapper memberMapper;

    private final CustomFileUtil fileUtil;

    @Override
    public Long register(CommunityCommentDTO commentDTO) {

        if (communityPostMapper.selectByPostNo(commentDTO.getPostNo()) == null) {
            throw new NoSuchElementException("존재하지 않는 게시글입니다.");
        }

        String nickname = memberMapper.selectByEmail(commentDTO.getWriterEmail()).getNickname();

        Long parentCommentNo = commentDTO.getParentCommentNo();

        if (parentCommentNo != null) {

            CommunityComment parent = Optional.ofNullable(communityCommentMapper.selectByCommentNo(parentCommentNo))
                .orElseThrow(() -> new NoSuchElementException("존재하지 않는 댓글입니다."));

            if (parent.isReply()) {
                throw new IllegalArgumentException("대댓글에는 답글을 달 수 없습니다.");
            }
        }

        CommunityComment comment = CommunityComment.builder()
            .postNo(commentDTO.getPostNo())
            .writerEmail(commentDTO.getWriterEmail())
            .nickname(nickname)
            .parentCommentNo(parentCommentNo)
            .content(commentDTO.getContent())
            .build();

        communityCommentMapper.insert(comment);

        communityPostMapper.changeCommentCount(commentDTO.getPostNo(), 1);

        return comment.getCommentNo();
    }

    @Override
    public List<CommunityCommentDTO> listByPost(Long postNo) {

        return communityCommentMapper.selectListByPostNo(postNo)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    public void modify(CommunityCommentDTO commentDTO, String email) {

        CommunityComment comment = findOwnedOrThrow(commentDTO.getCommentNo(), email);

        comment.changeContent(commentDTO.getContent());

        communityCommentMapper.update(comment);
    }

    @Override
    public void remove(Long commentNo, String email) {

        CommunityComment comment = findOwnedOrThrow(commentNo, email);

        communityCommentMapper.updateToDelete(commentNo);

        communityPostMapper.changeCommentCount(comment.getPostNo(), -1);
    }

    @Override
    public List<String> addImages(Long commentNo, String email, List<MultipartFile> files) {

        findOwnedOrThrow(commentNo, email);

        List<String> savedNames = fileUtil.saveFiles(files);

        if (savedNames == null || savedNames.isEmpty()) {
            return List.of();
        }

        int ord = communityCommentMapper.selectImages(commentNo).size();

        for (int i = 0; i < savedNames.size(); i++) {

            boolean video = isVideo(files.get(i));

            communityCommentMapper.insertImage(
                CommunityCommentImage.builder()
                    .commentNo(commentNo)
                    .fileName(savedNames.get(i))
                    .video(video)
                    .ord(ord++)
                    .build()
            );
        }

        return savedNames;
    }

    private CommunityComment findOwnedOrThrow(Long commentNo, String email) {

        CommunityComment comment = Optional.ofNullable(communityCommentMapper.selectByCommentNo(commentNo))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 댓글입니다."));

        if (!comment.getWriterEmail().equals(email)) {
            throw new AccessDeniedException("본인이 작성한 댓글만 처리할 수 있습니다.");
        }

        return comment;
    }

    private boolean isVideo(MultipartFile file) {

        String contentType = file.getContentType();

        return contentType != null && contentType.startsWith("video");
    }

    private CommunityCommentDTO toDTO(CommunityComment comment) {

        boolean deleted = comment.isDelFlag();

        List<CommunityImageDTO> imageList = deleted
            ? List.of()
            : comment.getImageList().stream()
                .map(image -> CommunityImageDTO.builder()
                    .fileName(image.getFileName())
                    .video(image.isVideo())
                    .build())
                .collect(Collectors.toList());

        return CommunityCommentDTO.builder()
            .commentNo(comment.getCommentNo())
            .postNo(comment.getPostNo())
            .writerEmail(comment.getWriterEmail())
            .nickname(comment.getNickname())
            .parentCommentNo(comment.getParentCommentNo())
            .content(deleted ? null : comment.getContent())
            .deleted(deleted)
            .imageList(imageList)
            .regTime(comment.getRegTime())
            .modTime(comment.getModTime())
            .build();
    }
}
