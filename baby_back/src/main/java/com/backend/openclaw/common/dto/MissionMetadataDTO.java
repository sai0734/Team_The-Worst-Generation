package com.backend.openclaw.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissionMetadataDTO {

    // 미션 JSON 형식의 버전이라는데 기본은 1이고, 이후에 구조가 변경(혹은 추가)되면 버전을 바꿔서 한다.
    @Builder.Default
    private int schemaVersion = 1;

    // 미션마다 하나씩 발급하는 고유 번호(오픈클로가 결과를 줄때 어떤 요청의 결과인지 찾기 위함)
    private String missionId;

    // 이거는 어느 기능에서 준건지 알기 위함
    private MissionSource source;

    // 실제 발송 여부를 결정하는 안전 장치(false 면 실제 문자 or 전화 실행)
    @Builder.Default
    private boolean dryRun = true;

    // 누가 요청했는지
    private String requestedBy;

    // 미션이 언제 만들어졌는지
    private Instant requestedAt;



}