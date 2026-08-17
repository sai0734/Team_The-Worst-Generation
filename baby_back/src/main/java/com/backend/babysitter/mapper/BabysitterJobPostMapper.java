package com.backend.babysitter.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.babysitter.domain.BabysitterJobPost;
import com.backend.babysitter.domain.BabysitterJobStatus;
import com.backend.babysitter.dto.BabysitterJobSearchDTO;

@Mapper
public interface BabysitterJobPostMapper {

    BabysitterJobPost selectByJobNo(@Param("jobNo") Long jobNo);

    List<BabysitterJobPost> selectList(
        @Param("search") BabysitterJobSearchDTO search,
        @Param("skip") int skip
    );

    long selectListCount(@Param("search") BabysitterJobSearchDTO search);

    List<BabysitterJobPost> selectListByParent(@Param("parentEmail") String parentEmail);

    // 지도 (내 주변) 후보군: 좌표가 있고 모집중인 구인글 전체. 거리 계산/반경 필터는 서비스단에서 처리
    List<BabysitterJobPost> selectNearbyCandidates();

    void insert(BabysitterJobPost jobPost);

    void updateStatus(@Param("jobNo") Long jobNo, @Param("status") BabysitterJobStatus status);
}
