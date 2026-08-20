package com.backend.hospital.general.domain;

public enum GeneralHospitalReservationStatus {

    // 예약 요청이 저장된 상태
    REQUESTED,

    // OpenClaw가 병원에 전화 중인 상태
    CONTACTING,

    // 병원에서 예약을 확정한 상태
    CONFIRMED,

    // 병원에서 예약을 거절한 상태
    REJECTED,

    // 병원과 통화하지 못한 상태
    CONTACT_FAILED,

    // 사용자가 예약을 취소한 상태
    CANCELED
}