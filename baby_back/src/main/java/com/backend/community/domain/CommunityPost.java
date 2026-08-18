package com.backend.community.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.*;

@Getter
@ToString(exclude = "imageList")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommunityPost {

    private Long postNo;

    private String writerEmail;

    private String nickname;

    private String category;

    private String title;

    private String content;

    private String aiSummary;

    @Builder.Default
    private int viewCount = 0;

    @Builder.Default
    private int commentCount = 0;

    @Builder.Default
    private int likeCount = 0;

    @Builder.Default
    private boolean delFlag = false;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    @Builder.Default
    private List<CommunityPostImage> imageList = new ArrayList<>();

    public void changeContent(String category, String title, String content) {
        this.category = category;
        this.title = title;
        this.content = content;
        this.aiSummary = null;
    }

    public void changeAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public void increaseViewCount() {
        this.viewCount++;
    }

    public void changeCommentCount(int delta) {
        this.commentCount += delta;
    }

    public void changeLikeCount(int delta) {
        this.likeCount += delta;
    }

    public void markDeleted() {
        this.delFlag = true;
    }
}
