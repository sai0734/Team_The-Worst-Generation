package com.backend.sleep.service;

import com.backend.sleep.dto.BabySleepDTO;

import java.util.List;

public interface BabySleepService {

    List<BabySleepDTO> getList(Long babyNo, String email);

    Long register(BabySleepDTO babySleepDTO, String email);

    void modify(BabySleepDTO babySleepDTO, String email);

    void remove(Long sleepNo, String email);

    String getSleepAdvice(Long babyNo, String email);
}
