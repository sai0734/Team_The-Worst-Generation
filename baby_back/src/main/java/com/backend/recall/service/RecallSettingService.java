package com.backend.recall.service;

import com.backend.recall.dto.RecallSettingDTO;

public interface RecallSettingService {

    RecallSettingDTO getSetting(String email);

    void updatePhone(String email, String notificationPhone);
}
