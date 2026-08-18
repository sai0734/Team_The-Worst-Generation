package com.backend.babysitter.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.babysitter.domain.BabysitterAvailability;
import com.backend.babysitter.domain.BabysitterProfile;
import com.backend.babysitter.dto.BabysitterSearchDTO;

@Mapper
public interface BabysitterProfileMapper {

    BabysitterProfile selectByEmail(@Param("email") String email);

    void insert(BabysitterProfile profile);

    void update(BabysitterProfile profile);

    void delete(@Param("email") String email);

    void updateProfileImage(
        @Param("email") String email,
        @Param("profileImageFileName") String profileImageFileName
    );

    List<BabysitterProfile> selectList(
        @Param("search") BabysitterSearchDTO search,
        @Param("skip") int skip
    );

    long selectListCount(@Param("search") BabysitterSearchDTO search);

    // 지도 (내 주변) 후보군: 좌표가 있고 활동중인 시터 전체. 거리 계산/반경 필터는 서비스단에서 처리
    List<BabysitterProfile> selectNearbyCandidates();

    List<BabysitterAvailability> selectAvailability(@Param("email") String email);

    void insertAvailability(BabysitterAvailability availability);

    void deleteAvailability(@Param("email") String email);
}
