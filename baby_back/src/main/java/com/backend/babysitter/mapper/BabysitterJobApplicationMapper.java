package com.backend.babysitter.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.babysitter.domain.BabysitterJobApplication;
import com.backend.babysitter.domain.BabysitterJobApplicationStatus;

@Mapper
public interface BabysitterJobApplicationMapper {

    BabysitterJobApplication selectByApplicationNo(@Param("applicationNo") Long applicationNo);

    BabysitterJobApplication selectOne(
        @Param("jobNo") Long jobNo,
        @Param("sitterEmail") String sitterEmail
    );

    List<BabysitterJobApplication> selectListByJob(@Param("jobNo") Long jobNo);

    List<BabysitterJobApplication> selectListBySitter(@Param("sitterEmail") String sitterEmail);

    long countByJob(@Param("jobNo") Long jobNo);

    void insert(BabysitterJobApplication application);

    void updateStatus(
        @Param("applicationNo") Long applicationNo,
        @Param("status") BabysitterJobApplicationStatus status
    );

    void rejectOtherPending(
        @Param("jobNo") Long jobNo,
        @Param("exceptApplicationNo") Long exceptApplicationNo
    );
}
