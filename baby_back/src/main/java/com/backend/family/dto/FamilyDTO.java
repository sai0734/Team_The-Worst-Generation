package com.backend.family.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FamilyDTO {

    private Long familyId;

    private String familyName;

    private String inviteCode;

    private String createdBy;

    private LocalDateTime createdAt;
}