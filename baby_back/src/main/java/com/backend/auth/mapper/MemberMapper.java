package com.backend.auth.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.auth.domain.Member;

@Mapper
public interface MemberMapper {

  Member selectByEmail(@Param("email") String email);

  void insert(Member member);

  void insertRole(@Param("email") String email, @Param("role") String role);

  void deleteRoles(@Param("email") String email);

  void update(Member member);
}