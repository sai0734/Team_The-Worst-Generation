package com.backend.family.projection;

import java.time.LocalDateTime;

import com.backend.family.domain.FamilyRole;
import com.backend.family.domain.ParentType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMemberProjection {

    private Long id;

    private Long familyId;

    private String memberEmail;

    private String nickname;

    private FamilyRole familyRole;

    private ParentType parentType;

    private LocalDateTime joinedAt;
}
