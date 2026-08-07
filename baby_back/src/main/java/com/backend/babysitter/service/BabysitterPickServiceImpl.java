package com.backend.babysitter.service;

import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.babysitter.domain.BabysitterPick;
import com.backend.babysitter.mapper.BabysitterPickMapper;
import com.backend.babysitter.mapper.BabysitterProfileMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class BabysitterPickServiceImpl implements BabysitterPickService {

    private final BabysitterPickMapper babysitterPickMapper;

    private final BabysitterProfileMapper babysitterProfileMapper;

    @Override
    public boolean toggle(String sitterEmail, String pickerEmail) {

        if (sitterEmail.equals(pickerEmail)) {
            throw new IllegalArgumentException("본인 프로필은 픽할 수 없습니다.");
        }

        if (babysitterProfileMapper.selectByEmail(sitterEmail) == null) {
            throw new NoSuchElementException("등록된 시터 프로필이 없습니다.");
        }

        BabysitterPick existing = babysitterPickMapper.selectOne(sitterEmail, pickerEmail);

        if (existing != null) {
            babysitterPickMapper.delete(sitterEmail, pickerEmail);
            return false;
        }

        babysitterPickMapper.insert(
            BabysitterPick.builder()
                .sitterEmail(sitterEmail)
                .pickerEmail(pickerEmail)
                .build()
        );

        return true;
    }

    @Override
    public long countBySitter(String sitterEmail) {

        return babysitterPickMapper.countBySitter(sitterEmail);
    }

    @Override
    public boolean isPicked(String sitterEmail, String pickerEmail) {

        return babysitterPickMapper.selectOne(sitterEmail, pickerEmail) != null;
    }
}
