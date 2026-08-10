package com.backend.family.dto;

import com.backend.family.domain.ParentType;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class FamilyCreateDTO {

    private String familyName;

    private ParentType parentType;
}