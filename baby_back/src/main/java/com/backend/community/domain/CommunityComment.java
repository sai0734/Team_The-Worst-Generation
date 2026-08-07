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
public class CommunityComment {

    private Long commentNo;

    private Long postNo;

    private String writerEmail;

    private String nickname;

    private Long parentCommentNo;

    private String content;

    @Builder.Default
    private boolean delFlag = false;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    @Builder.Default
    private List<CommunityCommentImage> imageList = new ArrayList<>();

    public void changeContent(String content) {
        this.content = content;
    }

    public void markDeleted() {
        this.delFlag = true;
    }

    public boolean isReply() {
        return parentCommentNo != null;
    }
}
