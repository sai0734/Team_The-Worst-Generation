package com.backend.hospital.emergency.validation;

import com.backend.openclaw.message.utils.PhoneNumberUtils;
import org.springframework.stereotype.Component;

@Component
public class EmergencyRoomSOSValidator {

    public String validateNotificationPhone(String notificationPhone) {
        String normalizedPhone = PhoneNumberUtils.normalize(notificationPhone);

        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            throw new IllegalArgumentException("문자 수신 번호가 필요합니다.");
        }

        if (!normalizedPhone.matches("^01[016789][0-9]{7,8}$")) {
            throw new IllegalArgumentException("올바른 휴대전화 번호가 필요합니다.");
        }

        return normalizedPhone;
    }

    public String validateRequester(String memberEmail) {
        if (memberEmail == null || memberEmail.isBlank()) {
            throw new IllegalArgumentException("회원 정보가 필요합니다.");
        }

        return memberEmail.trim();
    }
}
