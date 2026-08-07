package com.backend.babysitter.service;

import com.backend.babysitter.dto.BabysitterProfileDTO;
import com.backend.babysitter.dto.BabysitterSearchDTO;
import com.backend.dto.PageResponseDTO;

public interface BabysitterProfileService {

    BabysitterProfileDTO get(String email);

    void modify(BabysitterProfileDTO profileDTO);

    void remove(String email);

    PageResponseDTO<BabysitterProfileDTO> getList(BabysitterSearchDTO searchDTO);
}
