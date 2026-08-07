package com.backend.auth.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class MemberRefreshToken {

    private Long id;

    private String memberEmail;

    private String sessionId;

    private String tokenHash;

    private LocalDateTime expriesAt;

    private boolean revoked;

    private LocalDateTime usedAt;

    private String userAgent;

    private LocalDateTime createdAt;
}
