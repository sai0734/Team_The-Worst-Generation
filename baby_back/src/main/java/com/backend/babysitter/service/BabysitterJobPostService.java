package com.backend.babysitter.service;

import java.util.List;

import com.backend.babysitter.dto.BabysitterJobPostDTO;
import com.backend.babysitter.dto.BabysitterJobSearchDTO;
import com.backend.global.dto.PageResponseDTO;

public interface BabysitterJobPostService {

    Long register(BabysitterJobPostDTO jobPostDTO);

    BabysitterJobPostDTO get(Long jobNo);

    PageResponseDTO<BabysitterJobPostDTO> getList(BabysitterJobSearchDTO searchDTO);

    List<BabysitterJobPostDTO> getNearby(double lat, double lng, double radiusKm);

    List<BabysitterJobPostDTO> getMyJobPosts(String parentEmail);

    void cancel(Long jobNo, String parentEmail);
}
