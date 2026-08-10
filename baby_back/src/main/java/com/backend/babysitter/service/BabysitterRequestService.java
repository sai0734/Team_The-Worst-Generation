package com.backend.babysitter.service;

import java.util.List;

import com.backend.babysitter.dto.BabysitterRequestDTO;

public interface BabysitterRequestService {

    Long register(BabysitterRequestDTO requestDTO);

    List<BabysitterRequestDTO> listReceived(String sitterEmail);

    List<BabysitterRequestDTO> listSent(String parentEmail);

    void accept(Long requestNo, String sitterEmail);

    void reject(Long requestNo, String sitterEmail);

    void cancel(Long requestNo, String parentEmail);
}
