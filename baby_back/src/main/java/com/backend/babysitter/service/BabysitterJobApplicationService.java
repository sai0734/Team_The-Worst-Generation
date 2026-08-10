package com.backend.babysitter.service;

import java.util.List;

import com.backend.babysitter.dto.BabysitterJobApplicationDTO;

public interface BabysitterJobApplicationService {

    Long apply(Long jobNo, String sitterEmail, String message);

    List<BabysitterJobApplicationDTO> listByJob(Long jobNo, String parentEmail);

    List<BabysitterJobApplicationDTO> listBySitter(String sitterEmail);

    void accept(Long applicationNo, String parentEmail);

    void reject(Long applicationNo, String parentEmail);
}
