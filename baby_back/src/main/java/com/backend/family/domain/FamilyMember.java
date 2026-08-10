package com.backend.family.domain;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class FamilyMember {

    private Long id;

    private Long familyId;

    private String memberEmail;

    private FamilyRole familyRole;

    private ParentType parentType;

    private LocalDateTime joinedAt;
}