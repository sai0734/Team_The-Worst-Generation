package com.backend.family.mapper;

import com.backend.family.domain.Family;
import com.backend.family.domain.FamilyMember;
import com.backend.family.projection.FamilyMemberProjection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FamilyMapper {
    void insertFamily(Family family);

    void insertFamilyMember(FamilyMember familyMember);

    Family selectFamilyByInviteCode(@Param("inviteCode") String inviteCode);

    Family selectFamilyByMemberEmail(@Param("memberEmail") String memberEmail);

    FamilyMember selectFamilyMemberByEmail(@Param("memberEmail") String memberEmail);

    List<FamilyMemberProjection> selectFamilyMembers(@Param("familyId") Long familyId);

    void deleteFamilyMember(@Param("memberEmail") String memberEmail);
}

