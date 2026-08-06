package com.backend.auth.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.auth.domain.MemberSocial;

@Mapper
public interface MemberSocialMapper {

  MemberSocial selectByProvider(
      @Param("provider") String provider,
      @Param("providerId") String providerId);

  MemberSocial selectByMemberAndProvider(
      @Param("memberEmail") String memberEmail,
      @Param("provider") String provider);

  void insert(MemberSocial memberSocial);
}



