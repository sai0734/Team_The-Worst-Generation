package com.backend.auth.service;

import com.backend.auth.domain.Member;
import com.backend.auth.domain.MemberRefreshToken;
import com.backend.auth.domain.MemberRole;
import com.backend.auth.mapper.MemberMapper;
import com.backend.auth.mapper.MemberRefreshTokenMapper;
import com.backend.auth.profile.domain.MemberProfile;
import com.backend.auth.profile.mapper.MemberProfileMapper;
import com.backend.auth.util.AuthTokenUtil;
import com.backend.family.domain.ParentType;
import com.backend.global.util.JWTUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthTokenServiceImplTests {

    private static final String EMAIL = "profile-owner@test.com";
    private static final String SESSION_ID = "profile-session-id";
    private static final String JWT_SECRET = "profile-test-secret-key-that-is-long-enough-for-hs256";

    @Mock
    private MemberMapper memberMapper;

    @Mock
    private MemberRefreshTokenMapper memberRefreshTokenMapper;

    @Mock
    private MemberProfileMapper memberProfileMapper;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    private AuthTokenServiceImpl service;

    @BeforeEach
    void setUp() {
        JWTUtil jwtUtil = new JWTUtil();
        ReflectionTestUtils.setField(jwtUtil, "secretValue", JWT_SECRET);
        jwtUtil.init();

        service = new AuthTokenServiceImpl(
                memberMapper,
                memberRefreshTokenMapper,
                memberProfileMapper);
    }

    @Test
    void selectProfile_storesSelectionAndIssuesProfileAccessToken() {
        Long profileId = 7L;
        String refreshToken = createRefreshToken();
        MemberRefreshToken savedToken = savedToken(refreshToken, profileId);
        MemberProfile profile = profile(profileId, EMAIL);

        when(memberRefreshTokenMapper.selectByTokenHash(AuthTokenUtil.hashToken(refreshToken)))
                .thenReturn(savedToken);
        when(memberProfileMapper.selectByProfileId(profileId)).thenReturn(profile);
        when(memberRefreshTokenMapper.updateSelectedProfileBySessionId(SESSION_ID, profileId))
                .thenReturn(1);
        when(memberMapper.selectByEmail(EMAIL)).thenReturn(member());

        Map<String, Object> result = service.selectProfile(refreshToken, profileId);

        assertThat(result.get("profileId")).isEqualTo(profileId);
        assertThat(result.get("profileName")).isEqualTo("엄마");
        assertThat(result.get("parentType")).isEqualTo("MOTHER");

        Map<String, Object> accessClaims = JWTUtil.validateToken((String) result.get("accessToken"));
        assertThat(((Number) accessClaims.get("profileId")).longValue()).isEqualTo(profileId);
        assertThat(accessClaims.get("profileName")).isEqualTo("엄마");
        assertThat(accessClaims.get("parentType")).isEqualTo("MOTHER");
        assertThat(accessClaims.get("pw")).isEqualTo("encoded-password");
        assertThat(accessClaims.get("tokenType")).isEqualTo(AuthTokenUtil.ACCESS_TOKEN_TYPE);

        verify(memberRefreshTokenMapper)
                .updateSelectedProfileBySessionId(SESSION_ID, profileId);
    }

    @Test
    void selectProfile_rejectsProfileOwnedByAnotherMember() {
        Long profileId = 8L;
        String refreshToken = createRefreshToken();

        when(memberRefreshTokenMapper.selectByTokenHash(AuthTokenUtil.hashToken(refreshToken)))
                .thenReturn(savedToken(refreshToken, null));
        when(memberProfileMapper.selectByProfileId(profileId))
                .thenReturn(profile(profileId, "another-member@test.com"));

        assertThatThrownBy(() -> service.selectProfile(refreshToken, profileId))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessage("PROFILE_NOT_FOUND");

        verify(memberRefreshTokenMapper, never())
                .updateSelectedProfileBySessionId(any(), any());
        verify(memberMapper, never()).selectByEmail(any());
    }

    @Test
    void refreshAccessToken_keepsSelectedProfileInNewTokenSession() {
        Long profileId = 9L;
        String refreshToken = createRefreshToken();

        when(memberRefreshTokenMapper.selectByTokenHash(AuthTokenUtil.hashToken(refreshToken)))
                .thenReturn(savedToken(refreshToken, profileId));
        when(memberRefreshTokenMapper.markUsed(1L)).thenReturn(1);
        when(memberMapper.selectByEmail(EMAIL)).thenReturn(member());
        when(memberProfileMapper.selectByProfileId(profileId))
                .thenReturn(profile(profileId, EMAIL));
        when(request.getHeader("User-Agent")).thenReturn("profile-test-agent");

        Map<String, Object> result = service.refreshAccessToken(refreshToken, request, response);

        Map<String, Object> accessClaims = JWTUtil.validateToken((String) result.get("accessToken"));
        assertThat(((Number) accessClaims.get("profileId")).longValue()).isEqualTo(profileId);
        assertThat(accessClaims.get("profileName")).isEqualTo("엄마");
        assertThat(accessClaims.get("pw")).isEqualTo("encoded-password");

        ArgumentCaptor<MemberRefreshToken> tokenCaptor =
                ArgumentCaptor.forClass(MemberRefreshToken.class);
        verify(memberRefreshTokenMapper).insert(tokenCaptor.capture());
        assertThat(tokenCaptor.getValue().getSessionId()).isEqualTo(SESSION_ID);
        assertThat(tokenCaptor.getValue().getSelectedProfileId()).isEqualTo(profileId);
    }

    private String createRefreshToken() {
        return AuthTokenUtil.generateRefreshToken(
                Map.of("email", EMAIL),
                SESSION_ID,
                10);
    }

    private MemberRefreshToken savedToken(String refreshToken, Long selectedProfileId) {
        return MemberRefreshToken.builder()
                .id(1L)
                .memberEmail(EMAIL)
                .sessionId(SESSION_ID)
                .selectedProfileId(selectedProfileId)
                .tokenHash(AuthTokenUtil.hashToken(refreshToken))
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
    }

    private MemberProfile profile(Long profileId, String memberEmail) {
        return MemberProfile.builder()
                .profileId(profileId)
                .memberEmail(memberEmail)
                .profileName("엄마")
                .parentType(ParentType.MOTHER)
                .active(true)
                .build();
    }

    private Member member() {
        return Member.builder()
                .email(EMAIL)
                .pw("encoded-password")
                .nickname("프로필 테스트")
                .memberRoleList(List.of(MemberRole.USER))
                .build();
    }
}
