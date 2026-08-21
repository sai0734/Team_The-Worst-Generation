package com.backend.recall.domain;

import lombok.*;

// 리콜 문자 알림 받을 번호 (회원당 1개)
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class RecallSetting {

    private String email;

    private String notificationPhone;
}
