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

    void insert(BabysitterJobPost jobPost);

    void updateStatus(@Param("jobNo") Long jobNo, @Param("status") BabysitterJobStatus status);
}
