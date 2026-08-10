package com.backend.family.dto;

import java.time.LocalDateTime;

import com.backend.family.domain.FamilyRole;
import com.backend.family.domain.ParentType;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilyMemberDTO {

    private Long id;

    private Long familyId;

    private String memberEmail;

    private String nickname;

    private FamilyRole familyRole;

    private ParentType parentType;

    private LocalDateTime joinedAt;
}