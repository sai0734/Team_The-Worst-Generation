package com.backend.cryCheck.service;

import com.backend.cryCheck.dto.CryCheckDTO;

import java.util.List;

public interface CryCheckService {

    CryCheckDTO analyze(CryCheckDTO cryCheckDTO, String email);

    CryCheckDTO get(Long cryCheckNo, String email);

    List<CryCheckDTO> getList(Long babyNo, String email);
}
