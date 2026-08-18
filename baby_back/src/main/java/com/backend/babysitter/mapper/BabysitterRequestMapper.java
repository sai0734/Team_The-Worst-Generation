package com.backend.babysitter.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.babysitter.domain.BabysitterRequest;
import com.backend.babysitter.domain.BabysitterRequestStatus;

@Mapper
public interface BabysitterRequestMapper {

    BabysitterRequest selectByRequestNo(@Param("requestNo") Long requestNo);

    List<BabysitterRequest> selectListBySitter(@Param("sitterEmail") String sitterEmail);

    List<BabysitterRequest> selectListByParent(@Param("parentEmail") String parentEmail);

    long countAcceptedBySitter(@Param("sitterEmail") String sitterEmail);

    void insert(BabysitterRequest request);

    void updateStatus(@Param("requestNo") Long requestNo, @Param("status") BabysitterRequestStatus status);
}
