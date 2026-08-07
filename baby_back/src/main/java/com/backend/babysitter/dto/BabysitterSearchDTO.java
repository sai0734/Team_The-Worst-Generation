package com.backend.babysitter.dto;

import com.backend.dto.PageRequestDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterSearchDTO extends PageRequestDTO {

    private String region;

    private String keyword;

    private Integer minCareerYears;
}
