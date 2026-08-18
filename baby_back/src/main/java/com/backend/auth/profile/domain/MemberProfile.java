package com.backend.auth.profile.domain;

import com.backend.family.domain.ParentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MemberProfile {

    private Long profileId;

    private String memberEmail;

    private String profileName;

    private ParentType parentType;

    private String profileImageFileName;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime regTime;

    private LocalDateTime modTime;
}