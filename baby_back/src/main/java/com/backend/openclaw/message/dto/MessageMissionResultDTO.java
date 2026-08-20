package com.backend.openclaw.message.dto;

import com.backend.openclaw.common.dto.MissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageMissionResultDTO {

    // 요청한 문자 미션 ID
    private String missionId;

    // DRY_RUN, SUCCESS, FAILED
    private MissionStatus status;

    // OpenClaw가 요청을 처리했는지 여부
    private boolean accepted;

    // 문자 수신번호
    private String to;
}