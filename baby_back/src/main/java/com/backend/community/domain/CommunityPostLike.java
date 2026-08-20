package com.backend.community.domain;

import lombok.*;

import java.time.LocalDateTime;

// 공감(좋아요) - postNo + memberEmail UNIQUE 제약을 DB/매퍼에서 보장
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class CommunityPostLike {

    private Long likeNo;

    // FK (tbl_community_post.postNo)
    private Long postNo;

    // FK (tbl_member.email)
    private String memberEmail;

    private LocalDateTime regTime;
}
