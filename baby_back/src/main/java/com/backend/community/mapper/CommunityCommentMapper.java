package com.backend.community.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.community.domain.CommunityComment;
import com.backend.community.domain.CommunityCommentImage;

@Mapper
public interface CommunityCommentMapper {

    CommunityComment selectByCommentNo(@Param("commentNo") Long commentNo);

    List<CommunityComment> selectListByPostNo(@Param("postNo") Long postNo);

    void insert(CommunityComment comment);

    void update(CommunityComment comment);

    void updateToDelete(@Param("commentNo") Long commentNo);

    void insertImage(CommunityCommentImage image);

    List<CommunityCommentImage> selectImages(@Param("commentNo") Long commentNo);
}
