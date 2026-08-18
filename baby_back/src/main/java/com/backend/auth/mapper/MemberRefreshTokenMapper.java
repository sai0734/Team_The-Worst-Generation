package com.backend.auth.mapper;

import com.backend.auth.domain.MemberRefreshToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MemberRefreshTokenMapper {

    // 쿠키로 들어온 refreshToken hash 처리후 DB에서 찾기
    MemberRefreshToken selectByTokenHash(@Param("tokenHash") String tokenHash);

    // 로그인 or refresh 성공 시 새 refreshToken 저장
    void insert(MemberRefreshToken memberRefreshToken);

    // refresh 성공한 기존 토큰 사용 처리
    int markUsed(@Param("id") Long id);

    // 로그아웃 시 현재 refreshToken 폐기
    void revokeByTokenHash(@Param("tokenHash") String tokenHash);

    // 이미 사용된 refreshToken이 다시 들어오면 같은 세션 계열 전체 폐기
    void revokeAllBySessionId(@Param("sessionId") String sessionId);

    int updateSelectedProfileBySessionId(
            @Param("sessionId") String sessionId,
            @Param("selectedProfileId") Long selectedProfileId);
}
