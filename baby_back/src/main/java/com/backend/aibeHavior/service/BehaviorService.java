package com.backend.aibeHavior.service;

import com.backend.aibeHavior.dto.BehaviorConsultRequest;
import com.backend.aibeHavior.dto.BehaviorConsultResponse;
import com.backend.aibeHavior.dto.BehaviorMessageRequest;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;

public interface BehaviorService {

    BehaviorConsultResponse createConsult(BehaviorConsultRequest request, String email);

    BehaviorConsultResponse addMessage(BehaviorMessageRequest request, String email);

    PageResponseDTO<BehaviorConsultResponse> getList(Long babyNo, String email, PageRequestDTO pageRequestDTO);

    BehaviorConsultResponse getDetail(Long consultNo, String email);

    void removeConsult(Long consultNo, String email);

}