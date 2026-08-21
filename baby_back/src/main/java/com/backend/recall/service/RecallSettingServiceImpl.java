package com.backend.recall.service;

import com.backend.openclaw.message.utils.PhoneNumberUtils;
import com.backend.recall.domain.RecallSetting;
import com.backend.recall.dto.RecallSettingDTO;
import com.backend.recall.mapper.RecallSettingMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class RecallSettingServiceImpl implements RecallSettingService {

    private static final String PHONE_PATTERN = "^01[016789][0-9]{7,8}$";

    private final RecallSettingMapper recallSettingMapper;

    @Override
    public RecallSettingDTO getSetting(String email) {

        RecallSetting setting = recallSettingMapper.selectByEmail(email);

        return RecallSettingDTO.builder()
            .email(email)
            .notificationPhone(setting != null ? setting.getNotificationPhone() : null)
            .build();
    }

    @Override
    public void updatePhone(String email, String notificationPhone) {

        String normalized = PhoneNumberUtils.normalize(notificationPhone);

        if (normalized == null || !normalized.matches(PHONE_PATTERN)) {
            throw new IllegalArgumentException("올바른 휴대폰 번호를 입력해주세요.");
        }

        if (recallSettingMapper.selectByEmail(email) == null) {
            recallSettingMapper.insert(
                RecallSetting.builder()
                    .email(email)
                    .notificationPhone(normalized)
                    .build()
            );
        } else {
            recallSettingMapper.updatePhone(email, normalized);
        }
    }
}
