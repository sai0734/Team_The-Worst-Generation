package com.backend.auth.service;

import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

import com.backend.auth.dto.KakaoLoginResultDTO;
import com.backend.auth.domain.Member;
import com.backend.auth.dto.SocialSignupRequestDTO;
import com.backend.auth.dto.MemberDTO;
import com.backend.auth.dto.MemberModifyDTO;

@Transactional
public interface MemberService {

  KakaoLoginResultDTO getKakaoLoginResult(String accessToken);

  void linkKakaoMember(String memberEmail, String socialLinkToken);

  MemberDTO signupAndLinkSocialMember(SocialSignupRequestDTO socialSignupRequestDTO);

  void modifyMember(String memberEmail, MemberModifyDTO memberModifyDTO);

  default MemberDTO entityToDTO(Member member) {

    MemberDTO dto = new MemberDTO(
        member.getEmail(),
        member.getPw(),
        member.getNickname(),
        member.isSocial(),
        member.getMemberRoleList().stream()
            .map(memberRole -> memberRole.name()).collect(Collectors.toList()));
    return dto;
  }
}



