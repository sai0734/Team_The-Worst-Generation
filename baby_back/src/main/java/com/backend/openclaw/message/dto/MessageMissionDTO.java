package com.backend.openclaw.message.dto;

import com.backend.openclaw.common.dto.MissionMetadataDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageMissionDTO {

    private MissionMetadataDTO metadata;
    private String to;
    private String content;
}