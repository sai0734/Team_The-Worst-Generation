package com.backend.recall.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SafetyKoreaRecallFileDTO {

    private String fileDiv;

    private String imageUrl;
}
