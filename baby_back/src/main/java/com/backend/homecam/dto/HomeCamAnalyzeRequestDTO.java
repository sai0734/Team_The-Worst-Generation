package com.backend.homecam.dto;

import lombok.Data;

@Data
public class HomeCamAnalyzeRequestDTO {

    // 안전영역으로 크롭된 현재 프레임 (base64)
    private String imageBase64;

}
