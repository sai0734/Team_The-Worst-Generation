package com.backend.health.service;

import com.backend.health.domain.BabySkinCheck;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BabySkinCheckServiceImpl {

    BabySkinCheck checkSkin(Long babyNo, MultipartFile image);

    List<BabySkinCheck> getHistory(Long babyNo);
}