package com.backend.ledger.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.backend.ledger.dto.LedgerClassifyResponseDTO;

public interface LedgerOcrService {

    List<LedgerClassifyResponseDTO> extractFromReceipt(MultipartFile image);
}
