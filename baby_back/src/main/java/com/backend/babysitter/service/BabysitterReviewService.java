package com.backend.babysitter.service;

import java.util.List;

import com.backend.babysitter.dto.BabysitterReviewDTO;

public interface BabysitterReviewService {

    Long register(BabysitterReviewDTO reviewDTO, String writerEmail);

    List<BabysitterReviewDTO> listBySitter(String sitterEmail);
}
