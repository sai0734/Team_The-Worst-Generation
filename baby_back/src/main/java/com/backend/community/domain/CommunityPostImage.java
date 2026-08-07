package com.backend.community.domain;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommunityPostImage {

    private Long imageNo;

    private Long postNo;

    private String fileName;

    private boolean video;

    private int ord;
}
