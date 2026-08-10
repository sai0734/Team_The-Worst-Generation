package com.backend.community.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.community.domain.CommunityPost;
import com.backend.community.domain.CommunityPostImage;
import com.backend.community.dto.CommunityPostSearchDTO;

@Mapper
public interface CommunityPostMapper {

    CommunityPost selectByPostNo(@Param("postNo") Long postNo);

    void insert(CommunityPost post);

    void update(CommunityPost post);

    void updateAiSummary(@Param("postNo") Long postNo, @Param("aiSummary") String aiSummary);

    void increaseViewCount(@Param("postNo") Long postNo);

    void changeCommentCount(@Param("postNo") Long postNo, @Param("delta") int delta);

    void updateToDelete(@Param("postNo") Long postNo);

    List<CommunityPost> selectList(@Param("search") CommunityPostSearchDTO search, @Param("skip") int skip);

    long selectListCount(@Param("search") CommunityPostSearchDTO search);

    void insertImage(CommunityPostImage image);

    List<CommunityPostImage> selectImages(@Param("postNo") Long postNo);

    void deleteImage(@Param("postNo") Long postNo, @Param("fileName") String fileName);
}
