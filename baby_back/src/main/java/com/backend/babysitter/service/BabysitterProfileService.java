package com.backend.babysitter.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.backend.babysitter.dto.BabysitterProfileDTO;
import com.backend.babysitter.dto.BabysitterSearchDTO;
import com.backend.global.dto.PageResponseDTO;

public interface BabysitterProfileService {

    BabysitterProfileDTO get(String email);

    void modify(BabysitterProfileDTO profileDTO);

    void remove(String email);

    PageResponseDTO<BabysitterProfileDTO> getList(BabysitterSearchDTO searchDTO);

    List<BabysitterProfileDTO> getNearby(double lat, double lng, double radiusKm);

    List<BabysitterProfileDTO> getMyPicks(String email);

    String changeProfileImage(String email, MultipartFile file);
}
