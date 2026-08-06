package com.backend.quest.service;

import com.backend.quest.mapper.PointMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor

public class PointServiceImpl implements PointService {

    private final PointMapper pointMapper;

    @Override
    public int getPoint(String email) {
        Integer point = pointMapper.selectPoint(email);
        return point == null ? 0 : point;
    }

    @Override
    public void add(String email, int amount, String reason, Long refId) {
        pointMapper.upsertPoint(email, amount);     //포인트 잔액 반영
        pointMapper.insertLog(email, amount, reason, refId);    // 로그 기록

    }

}
