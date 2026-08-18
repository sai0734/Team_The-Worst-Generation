package com.backend.community.mapper;

import com.backend.community.domain.CommunityPostLike;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CommunityPostLikeMapper {

    CommunityPostLike selectOne(@Param("postNo") Long postNo, @Param("memberEmail") String memberEmail);

    void insert(CommunityPostLike like);

    void delete(@Param("postNo") Long postNo, @Param("memberEmail") String memberEmail);

}
