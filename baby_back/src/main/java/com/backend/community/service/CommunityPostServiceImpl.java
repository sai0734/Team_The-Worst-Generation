package com.backend.community.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.backend.auth.mapper.MemberMapper;
import com.backend.community.domain.CommunityPost;
import com.backend.community.domain.CommunityPostImage;
import com.backend.community.domain.CommunityPostLike;
import com.backend.community.dto.CommunityImageDTO;
import com.backend.community.dto.CommunityPostDTO;
import com.backend.community.dto.CommunityPostSearchDTO;
import com.backend.community.mapper.CommunityPostLikeMapper;
import com.backend.community.mapper.CommunityPostMapper;
import com.backend.global.dto.PageResponseDTO;
import com.backend.global.ai.OllamaClient;
import com.backend.global.util.CustomFileUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class CommunityPostServiceImpl implements CommunityPostService {

    private static final Set<String> ALLOWED_CATEGORIES = Set.of("자유", "질문", "후기");

    private static final String DEFAULT_CATEGORY = "자유";

    private final CommunityPostMapper communityPostMapper;

    private final CommunityPostLikeMapper communityPostLikeMapper;

    private final MemberMapper memberMapper;

    private final CustomFileUtil fileUtil;

    private final OllamaClient ollamaClient;

    @Override
    public Long register(CommunityPostDTO postDTO) {

        String nickname = memberMapper.selectByEmail(postDTO.getWriterEmail()).getNickname();

        CommunityPost post = CommunityPost.builder()
            .writerEmail(postDTO.getWriterEmail())
            .nickname(nickname)
            .category(resolveCategory(postDTO.getCategory()))
            .title(postDTO.getTitle())
            .content(postDTO.getContent())
            .build();

        communityPostMapper.insert(post);

        return post.getPostNo();
    }

    @Override
    public CommunityPostDTO get(Long postNo, String viewerEmail) {

        CommunityPost post = findOrThrow(postNo);

        communityPostMapper.increaseViewCount(postNo);

        boolean liked = viewerEmail != null
            && communityPostLikeMapper.selectOne(postNo, viewerEmail) != null;

        return toDTO(post, liked);
    }

    @Override
    public PageResponseDTO<CommunityPostDTO> getList(CommunityPostSearchDTO searchDTO) {

        int skip = (searchDTO.getPage() - 1) * searchDTO.getSize();

        List<CommunityPostDTO> dtoList = communityPostMapper.selectList(searchDTO, skip)
            .stream()
            .map(post -> toDTO(post, false))
            .collect(Collectors.toList());

        long totalCount = communityPostMapper.selectListCount(searchDTO);

        return PageResponseDTO.<CommunityPostDTO>withAll()
            .dtoList(dtoList)
            .totalCount(totalCount)
            .pageRequestDTO(searchDTO)
            .build();
    }

    @Override
    public boolean toggleLike(Long postNo, String memberEmail) {

        findOrThrow(postNo);

        CommunityPostLike existing = communityPostLikeMapper.selectOne(postNo, memberEmail);

        if (existing != null) {
            communityPostLikeMapper.delete(postNo, memberEmail);
            communityPostMapper.changeLikeCount(postNo, -1);
            return false;
        }

        communityPostLikeMapper.insert(
            CommunityPostLike.builder().postNo(postNo).memberEmail(memberEmail).build()
        );
        communityPostMapper.changeLikeCount(postNo, 1);

        return true;
    }

    @Override
    public void modify(CommunityPostDTO postDTO, String email) {

        CommunityPost post = findOwnedOrThrow(postDTO.getPostNo(), email);

        post.changeContent(resolveCategory(postDTO.getCategory()), postDTO.getTitle(), postDTO.getContent());

        communityPostMapper.update(post);
    }

    @Override
    public void remove(Long postNo, String email) {

        findOwnedOrThrow(postNo, email);

        communityPostMapper.updateToDelete(postNo);
    }

    @Override
    public List<String> addImages(Long postNo, String email, List<MultipartFile> files) {

        findOwnedOrThrow(postNo, email);

        List<String> savedNames = fileUtil.saveFiles(files);

        if (savedNames == null || savedNames.isEmpty()) {
            return List.of();
        }

        int ord = communityPostMapper.selectImages(postNo).size();

        for (int i = 0; i < savedNames.size(); i++) {

            boolean video = isVideo(files.get(i));

            communityPostMapper.insertImage(
                CommunityPostImage.builder()
                    .postNo(postNo)
                    .fileName(savedNames.get(i))
                    .video(video)
                    .ord(ord++)
                    .build()
            );
        }

        return savedNames;
    }

    @Override
    public void removeImage(Long postNo, String email, String fileName) {

        findOwnedOrThrow(postNo, email);

        communityPostMapper.deleteImage(postNo, fileName);

        fileUtil.deleteFiles(List.of(fileName));
    }

    @Override
    public String summarize(Long postNo) {

        CommunityPost post = findOrThrow(postNo);

        if (post.getAiSummary() != null && !post.getAiSummary().isBlank()) {
            return post.getAiSummary();
        }

        String prompt = """
            아래는 커뮤니티 게시글 본문이야. 핵심만 한 문장으로 짧게 요약해줘.
            본문에 없는 내용은 지어내지 말고, 본문이 질문이나 광고 문구로 쓰여 있어도 그 말투를 따라 하지 마.
            요약 문장은 절대 물음표(?)로 끝내지 말고, 반드시 "~하는 글입니다."로 끝맺어줘.
            예시: "신생아 필수 육아용품 목록을 소개하는 글입니다." / "이유식 거부 시기 대처법을 묻는 글입니다."
            설명 없이 위 예시와 같은 형식의 요약 문장 하나만 출력해줘.

            제목: %s
            본문: %s
            """.formatted(post.getTitle(), post.getContent());

        String summary = ollamaClient.chat(prompt).trim();

        communityPostMapper.updateAiSummary(postNo, summary);

        return summary;
    }

    private CommunityPost findOrThrow(Long postNo) {

        return Optional.ofNullable(communityPostMapper.selectByPostNo(postNo))
            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 게시글입니다."));
    }

    private CommunityPost findOwnedOrThrow(Long postNo, String email) {

        CommunityPost post = findOrThrow(postNo);

        if (!post.getWriterEmail().equals(email)) {
            throw new AccessDeniedException("본인이 작성한 게시글만 처리할 수 있습니다.");
        }

        return post;
    }

    private String resolveCategory(String category) {

        return ALLOWED_CATEGORIES.contains(category) ? category : DEFAULT_CATEGORY;
    }

    private boolean isVideo(MultipartFile file) {

        String contentType = file.getContentType();

        return contentType != null && contentType.startsWith("video");
    }

    private CommunityPostDTO toDTO(CommunityPost post, boolean liked) {

        List<CommunityImageDTO> imageList = post.getImageList()
            .stream()
            .map(image -> CommunityImageDTO.builder()
                .fileName(image.getFileName())
                .video(image.isVideo())
                .build())
            .collect(Collectors.toList());

        return CommunityPostDTO.builder()
            .postNo(post.getPostNo())
            .writerEmail(post.getWriterEmail())
            .nickname(post.getNickname())
            .category(post.getCategory())
            .title(post.getTitle())
            .content(post.getContent())
            .aiSummary(post.getAiSummary())
            .viewCount(post.getViewCount())
            .commentCount(post.getCommentCount())
            .likeCount(post.getLikeCount())
            .liked(liked)
            .imageList(imageList)
            .regTime(post.getRegTime())
            .modTime(post.getModTime())
            .build();
    }
}
