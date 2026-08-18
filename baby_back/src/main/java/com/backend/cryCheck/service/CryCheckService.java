package com.backend.cryCheck.service;

import com.backend.cryCheck.dto.CryCheckDTO;

import java.util.List;

public interface CryCheckService {

    CryCheckDTO analyze(CryCheckDTO cryCheckDTO, String email);

    CryCheckDTO get(Long cryCheckNo, String email);

    List<CryCheckDTO> getList(Long babyNo, String email);

    void submitFeedback(Long cryCheckNo, String userFeedback, String email);

    // 삭제 성공 시 같이 지워야 할 오디오 파일명을 돌려줌 (없으면 null)
    String remove(Long cryCheckNo, String email);
}
