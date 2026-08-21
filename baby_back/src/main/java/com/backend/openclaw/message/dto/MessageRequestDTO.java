package com.backend.openclaw.message.dto;

import com.backend.openclaw.common.dto.MissionSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// 프론트에서 받아와서 요청하는 DTO
public class MessageRequestDTO {

    private MissionSource source;
    private String to;
    private String content;
}