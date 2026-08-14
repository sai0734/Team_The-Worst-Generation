package com.backend.album.service;

import com.backend.album.domain.BabyAlbum;
import com.backend.album.dto.BabyAlbumDTO;
import com.backend.album.mapper.BabyAlbumMapper;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class BabyAlbumServiceImpl implements BabyAlbumService {

    private final BabyAlbumMapper babyAlbumMapper;

    private final BabyInfoMapper babyInfoMapper;

    private final ModelMapper modelMapper;

    @Override
    public PageResponseDTO<BabyAlbumDTO> getList(Long babyNo, String email, String sort, PageRequestDTO pageRequestDTO) {

        log.info("babyAlbum_Service_getList_실행~~~~~~~~~~~~");

        int skip = (pageRequestDTO.getPage() - 1) * pageRequestDTO.getSize();

        List<BabyAlbum> result = babyAlbumMapper.selectList(babyNo, email, sort, skip, pageRequestDTO.getSize());

        List<BabyAlbumDTO> babyAlbumDTOList = result.stream()
                .map(album -> modelMapper.map(album, BabyAlbumDTO.class))
                .collect(Collectors.toList());

        long totalCount = babyAlbumMapper.selectListCount(babyNo, email);

        return PageResponseDTO.<BabyAlbumDTO>withAll()
                .dtoList(babyAlbumDTOList)
                .totalCount(totalCount)
                .pageRequestDTO(pageRequestDTO)
                .build();

    }

    @Override
    public Long register(BabyAlbumDTO babyAlbumDTO, String email) {

        log.info("babyAlbum_Service_register_실행~~~~~~~~~~~~");

        if (babyInfoMapper.selectByBabyNo(babyAlbumDTO.getBabyNo(), email) == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyAlbumDTO.getBabyNo());
        }

        BabyAlbum babyAlbum = BabyAlbum.builder()
                .babyNo(babyAlbumDTO.getBabyNo())
                .photoFileName(babyAlbumDTO.getPhotoFileName())
                .takenDate(babyAlbumDTO.getTakenDate())
                .latitude(babyAlbumDTO.getLatitude())
                .longitude(babyAlbumDTO.getLongitude())
                .build();

        babyAlbumMapper.insert(babyAlbum);

        return babyAlbum.getAlbumNo();

    }

    @Override
    public void remove(Long albumNo, String email) {

        log.info("babyAlbum_Service_remove_실행~~~~~~~~~~~~");

        babyAlbumMapper.delete(albumNo, email);

    }

}