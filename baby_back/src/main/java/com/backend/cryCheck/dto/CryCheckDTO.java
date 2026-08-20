package com.backend.crycheck.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CryCheckDTO {

    private Long cryCheckNo;

    private Long babyNo;

    private Double avgPitch;
    private Double avgVolume;
    private Double durationSeconds;
    private String pattern;

    private String aiResultJson;

    // 다시듣기용 저장 파일명 (DB 저장/조회 응답에만 쓰임)
    private String audioFileName;

    // 사용자가 나중에 알려준 실제 원인 (피드백 칩)
    private String userFeedback;

    private LocalDateTime regTime;

    // 분석 요청 시 업로드하는 오디오 파일 (컨트롤러에서만 사용, DB에는 저장 안 함)
    // 영상 파일이어도 프론트에서 오디오 트랙만 추출해서 이 필드로 올려줌
    private MultipartFile file;
}
