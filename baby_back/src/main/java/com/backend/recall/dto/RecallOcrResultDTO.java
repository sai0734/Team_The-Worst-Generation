package com.backend.recall.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecallOcrResultDTO {

    private String productName;

    private String brandName;

    private String modelName;

    private String certNum;

    private String rawText;

    private String imageName;
}
