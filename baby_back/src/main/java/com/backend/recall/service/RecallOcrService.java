package com.backend.recall.service;

import org.springframework.web.multipart.MultipartFile;

import com.backend.recall.dto.RecallOcrResultDTO;

public interface RecallOcrService {

    RecallOcrResultDTO extract(MultipartFile image);
}
