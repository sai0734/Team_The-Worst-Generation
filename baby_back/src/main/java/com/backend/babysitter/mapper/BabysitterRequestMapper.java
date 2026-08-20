package com.backend.babysitter.mapper;

import java.time.LocalDate;
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

    // 이미 수락되어 예약이 잡힌 날짜 목록 - 새 요청을 만들 때 중복 예약을 막는 용도
    List<LocalDate> selectAcceptedDatesBySitter(@Param("sitterEmail") String sitterEmail);

    void insert(BabysitterRequest request);

    void update(BabysitterRequest request);

    void updateStatus(@Param("requestNo") Long requestNo, @Param("status") BabysitterRequestStatus status);
}
