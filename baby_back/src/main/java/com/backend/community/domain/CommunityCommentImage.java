package com.backend.community.domain;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommunityCommentImage {

    private Long imageNo;

    private Long commentNo;

    private String fileName;

    private boolean video;

    private int ord;
}
