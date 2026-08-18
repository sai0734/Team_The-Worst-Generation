package com.backend.openclaw.common.dto;

// 실행 결과를 보여주는 곳
public enum MissionStatus {
    // 전달됐지만 아직 실행 이전
    PENDING,

    // 전체 성공
    SUCCESS,

    // 문자 or 전화 중 일부만 성공
    PARTIAL,

    // 실패
    FAILED
}