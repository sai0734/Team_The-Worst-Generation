package com.backend.recall.dto;

import java.time.LocalDateTime;

import com.backend.recall.domain.RecallMatchType;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MyProductDTO {

    private Long productNo;

    private String memberEmail;

    private String productName;

    private String brandName;

    private String modelName;

    private String certNum;

    private boolean recallMatched;

    private RecallMatchType recallType;

    private String recallUid;

    private String recallTitle;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime checkedTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime regTime;
}