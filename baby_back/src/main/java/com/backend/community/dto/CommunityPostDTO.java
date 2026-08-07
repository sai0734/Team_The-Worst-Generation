package com.backend.community.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommunityPostDTO {

    private Long postNo;

    private String writerEmail;

    private String nickname;

    private String title;

    private String content;

    private String aiSummary;

    private int viewCount;

    private int commentCount;

    @Builder.Default
    private List<CommunityImageDTO> imageList = List.of();

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime regTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime modTime;
}
