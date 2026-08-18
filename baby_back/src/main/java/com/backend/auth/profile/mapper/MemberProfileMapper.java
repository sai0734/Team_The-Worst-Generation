package com.backend.auth.profile.mapper;

import com.backend.auth.profile.domain.MemberProfile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MemberProfileMapper {

    MemberProfile selectByProfileId(@Param("profileId") Long profileId);

    List<MemberProfile> selectListByMemberEmail(@Param("memberEmail") String memberEmail);

    void insert(MemberProfile memberProfile);

    void update(MemberProfile memberProfile);

    void deactivate(@Param("profileId") Long profileId);
}