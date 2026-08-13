package com.backend.album.service;

import com.backend.album.dto.BabyAlbumDTO;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;

public interface BabyAlbumService {

    PageResponseDTO<BabyAlbumDTO> getList(Long babyNo, String email, String sort, PageRequestDTO pageRequestDTO);

    Long register(BabyAlbumDTO babyAlbumDTO, String email);

    void remove(Long albumNo, String email);

}