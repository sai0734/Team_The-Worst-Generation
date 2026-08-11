package com.backend.auth.service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import com.backend.auth.domain.MemberSocial;
import com.backend.auth.domain.MemberRole;
import com.backend.auth.dto.KakaoLoginResultDTO;
import com.backend.auth.dto.MemberSignupRequestDTO;
import com.backend.auth.dto.SocialSignupRequestDTO;
import com.backend.auth.mapper.MemberSocialMapper;
import com.backend.auth.domain.Member;
import com.backend.auth.dto.MemberModifyDTO;
import com.backend.auth.mapper.MemberMapper;
import com.backend.auth.dto.MemberDTO;
import com.backend.global.util.JWTUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Log4j2
public class MemberServiceImpl implements MemberService {

  private static final String KAKAO_PROVIDER = "KAKAO";
  private static final String SOCIAL_LINK_PURPOSE = "SOCIAL_LINK";

  private final MemberMapper memberMapper;
  private final MemberSocialMapper memberSocialMapper;
  private final PasswordEncoder passwordEncoder;

  // 카카오 로그인으로 들어온 사용자를
  // 1. 기존 로그인된 유저 -> 소셜 연결
  // 2. 소셜 로그인 -> 동일 이메일 발견 -> 인증 후 연결
  // 3. 소셜 로그인 -> 동일 이메일 없음 -> 기존 회원가입 먼저 요청 후 연결
  @Override
  public KakaoLoginResultDTO getKakaoLoginResult(String accessToken) {

    KakaoProfile kakaoProfile = getProfileFromKakaoAccessToken(accessToken);

    MemberSocial linkedSocial = memberSocialMapper.selectByProvider(KAKAO_PROVIDER, kakaoProfile.providerId());

    if (linkedSocial != null) {
      Member linkedMember = Optional.ofNullable(memberMapper.selectByEmail(linkedSocial.getMemberEmail()))
          .orElseThrow();
      return KakaoLoginResultDTO.login(entityToDTO(linkedMember));
    }

    String socialLinkToken = generateSocialLinkToken(kakaoProfile);

    if (kakaoProfile.email() != null && !kakaoProfile.email().isBlank()) {
      Member existingMember = memberMapper.selectByEmail(kakaoProfile.email());

      if (existingMember != null) {
        return KakaoLoginResultDTO.needAccountAuth(kakaoProfile.email(), socialLinkToken);
      }
    }

    return KakaoLoginResultDTO.needSignup(kakaoProfile.email(), socialLinkToken);
  }

  // 기존에 회원이 있는 1,2번 상황의 사용자. 소셜 로그인을 하면 기존 계정과 연결 시켜준다.
  @Override
  public void linkKakaoMember(String memberEmail, String socialLinkToken) {

    SocialLinkInfo socialLinkInfo = getSocialLinkInfo(socialLinkToken);

    Optional.ofNullable(memberMapper.selectByEmail(memberEmail)).orElseThrow();

    linkMemberSocial(memberEmail, socialLinkInfo);
  }

  @Override
  public MemberDTO signupMember(MemberSignupRequestDTO memberSignupRequestDTO) {

    validateMemberSignupRequest(memberSignupRequestDTO);

    if (memberMapper.selectByEmail(memberSignupRequestDTO.getEmail()) != null) {
      throw new IllegalStateException("MEMBER_ALREADY_EXISTS");
    }

    Member member = createMember(
        memberSignupRequestDTO.getEmail(),
        memberSignupRequestDTO.getPw(),
        memberSignupRequestDTO.getNickname());

    return entityToDTO(member);
  }

  // 기존에 회원이 아닌 3번의 상황의 사용자. 기존 회원가입을 먼저 하게 한 후 소셜을 연결 한다.
  @Override
  public MemberDTO signupAndLinkSocialMember(SocialSignupRequestDTO socialSignupRequestDTO) {

    validateSignupRequest(socialSignupRequestDTO);

    SocialLinkInfo socialLinkInfo = getSocialLinkInfo(socialSignupRequestDTO.getSocialLinkToken());

    if (socialLinkInfo.providerEmail() != null
        && !socialLinkInfo.providerEmail().isBlank()
        && !socialLinkInfo.providerEmail().equalsIgnoreCase(socialSignupRequestDTO.getEmail())) {
      throw new IllegalStateException("SOCIAL_EMAIL_MISMATCH");
    }

    if (memberMapper.selectByEmail(socialSignupRequestDTO.getEmail()) != null) {
      throw new IllegalStateException("MEMBER_ALREADY_EXISTS");
    }

    Member member = createMember(
        socialSignupRequestDTO.getEmail(),
        socialSignupRequestDTO.getPw(),
        socialSignupRequestDTO.getNickname());

    linkMemberSocial(member.getEmail(), socialLinkInfo);

    return entityToDTO(member);
  }

  private Member createMember(String email, String pw, String nickname) {

    Member member = Member.builder()
        .email(email)
        .pw(passwordEncoder.encode(pw))
        .nickname(nickname)
        .social(false)
        .build();

    member.addRole(MemberRole.USER);

    memberMapper.insert(member);
    member.getMemberRoleList()
        .forEach(role -> memberMapper.insertRole(member.getEmail(), role.name()));

    return member;
  }

  // 하나의 카카오 계정이 여러 회원에게 연결되지 않도록 막고 저장한다.
  private void linkMemberSocial(String memberEmail, SocialLinkInfo socialLinkInfo) {

    MemberSocial linkedSocial = memberSocialMapper.selectByProvider(
        socialLinkInfo.provider(), socialLinkInfo.providerId());

    if (linkedSocial != null) {
      if (!memberEmail.equals(linkedSocial.getMemberEmail())) {
        throw new IllegalStateException("SOCIAL_ALREADY_LINKED");
      }
      return;
    }

    MemberSocial linkedMember = memberSocialMapper.selectByMemberAndProvider(memberEmail, socialLinkInfo.provider());

    if (linkedMember != null) {
      throw new IllegalStateException("MEMBER_ALREADY_HAS_SOCIAL");
    }

    MemberSocial memberSocial = MemberSocial.builder()
        .memberEmail(memberEmail)
        .provider(socialLinkInfo.provider())
        .providerId(socialLinkInfo.providerId())
        .providerEmail(socialLinkInfo.providerEmail())
        .build();

    memberSocialMapper.insert(memberSocial);
  }

  // 카카오 사용자 API를 호출해서 providerId와 후보 이메일을 가져온다.
  private KakaoProfile getProfileFromKakaoAccessToken(String accessToken) {

    String kakaoGetUserURL = "https://kapi.kakao.com/v2/user/me";

    if (accessToken == null || accessToken.isBlank()) {
      throw new RuntimeException("Access Token is null");
    }

    RestTemplate restTemplate = new RestTemplate();

    HttpHeaders headers = new HttpHeaders();
    headers.add("Authorization", "Bearer " + accessToken);
    headers.add("Content-Type", "application/x-www-form-urlencoded");
    HttpEntity<String> entity = new HttpEntity<>(headers);

    UriComponents uriBuilder = UriComponentsBuilder.fromUriString(kakaoGetUserURL).build();

    ResponseEntity<LinkedHashMap> response =
        restTemplate.exchange(
            uriBuilder.toString(),
            HttpMethod.GET,
            entity,
            LinkedHashMap.class);

    LinkedHashMap<?, ?> bodyMap = response.getBody();

    if (bodyMap == null || bodyMap.get("id") == null) {
      throw new RuntimeException("Kakao response is invalid");
    }

    Object kakaoAccountObj = bodyMap.get("kakao_account");
    String email = null;

    if (kakaoAccountObj instanceof LinkedHashMap<?, ?> kakaoAccount) {
      Object emailObj = kakaoAccount.get("email");
      email = emailObj == null ? null : String.valueOf(emailObj);
    }

    return new KakaoProfile(String.valueOf(bodyMap.get("id")), email);
  }

  // 클라이언트가 providerId/email을 조작하지 못하도록 서버 서명 임시 토큰을 만든다.
  private String generateSocialLinkToken(KakaoProfile kakaoProfile) {

    Map<String, Object> claims = new HashMap<>();
    claims.put("purpose", SOCIAL_LINK_PURPOSE);
    claims.put("provider", KAKAO_PROVIDER);
    claims.put("providerId", kakaoProfile.providerId());

    if (kakaoProfile.email() != null) {
      claims.put("providerEmail", kakaoProfile.email());
    }

    return JWTUtil.generateToken(claims, 10);
  }

  // 카카오 로그인 진입 단계에서 만든 임시 토큰을 검증하고 연동 정보를 꺼낸다.
  private SocialLinkInfo getSocialLinkInfo(String socialLinkToken) {

    if (socialLinkToken == null || socialLinkToken.isBlank()) {
      throw new IllegalStateException("SOCIAL_LINK_TOKEN_REQUIRED");
    }

    Map<String, Object> claims = JWTUtil.validateToken(socialLinkToken);

    String purpose = getStringClaim(claims, "purpose");
    String provider = getStringClaim(claims, "provider");
    String providerId = getStringClaim(claims, "providerId");
    String providerEmail = getStringClaim(claims, "providerEmail");

    if (!SOCIAL_LINK_PURPOSE.equals(purpose) || !KAKAO_PROVIDER.equals(provider) || providerId == null) {
      throw new IllegalStateException("INVALID_SOCIAL_LINK_TOKEN");
    }

    return new SocialLinkInfo(provider, providerId, providerEmail);
  }

  // 선택 claim 값을 문자열로 안전하게 꺼낸다.
  private String getStringClaim(Map<String, Object> claims, String key) {

    Object value = claims.get(key);
    return value == null ? null : String.valueOf(value);
  }

  // 회원 생성 전에 소셜 회원가입 요청의 필수값을 확인한다.
  private void validateSignupRequest(SocialSignupRequestDTO socialSignupRequestDTO) {

    if (socialSignupRequestDTO == null
        || socialSignupRequestDTO.getEmail() == null
        || socialSignupRequestDTO.getEmail().isBlank()
        || socialSignupRequestDTO.getPw() == null
        || socialSignupRequestDTO.getPw().isBlank()
        || socialSignupRequestDTO.getNickname() == null
        || socialSignupRequestDTO.getNickname().isBlank()
        || socialSignupRequestDTO.getSocialLinkToken() == null
        || socialSignupRequestDTO.getSocialLinkToken().isBlank()) {
      throw new IllegalStateException("INVALID_SIGNUP_REQUEST");
    }
  }

  private void validateMemberSignupRequest(MemberSignupRequestDTO memberSignupRequestDTO) {

    if (memberSignupRequestDTO == null
        || memberSignupRequestDTO.getEmail() == null
        || memberSignupRequestDTO.getEmail().isBlank()
        || memberSignupRequestDTO.getPw() == null
        || memberSignupRequestDTO.getPw().isBlank()
        || memberSignupRequestDTO.getNickname() == null
        || memberSignupRequestDTO.getNickname().isBlank()) {
      throw new IllegalStateException("INVALID_SIGNUP_REQUEST");
    }
  }

  // 기존 회원 정보 수정 로직이며 카카오 소셜 연동 분기와는 별개다.
  @Override
  public void modifyMember(String memberEmail, MemberModifyDTO memberModifyDTO) {

    Member member = Optional.ofNullable(memberMapper.selectByEmail(memberEmail))
            .orElseThrow();

    member.changePw(passwordEncoder.encode(memberModifyDTO.getPw()));
    member.changeSocial(false);
    member.changeNickname(memberModifyDTO.getNickname());

    memberMapper.update(member);
  }

  private record KakaoProfile(String providerId, String email) {
  }

  private record SocialLinkInfo(String provider, String providerId, String providerEmail) {
  }
}



