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
public class Family {

    private Long familyId;

    private String familyName;

    private String inviteCode;

    private String createdBy;

    private LocalDateTime createdAt;

}