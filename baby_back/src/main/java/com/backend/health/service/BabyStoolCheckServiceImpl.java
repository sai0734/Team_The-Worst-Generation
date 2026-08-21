package com.backend.health.service;

import com.backend.health.domain.BabyStoolCheck;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BabyStoolCheckServiceImpl {

    BabyStoolCheck checkStool(Long babyNo, MultipartFile image, String email);

    List<BabyStoolCheck> getHistory(Long babyNo, String email);
}