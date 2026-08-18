package com.backend.album.mapper;

import com.backend.album.domain.BabyAlbum;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabyAlbumMapper {

    List<BabyAlbum> selectList(@Param("babyNo") Long babyNo, @Param("email") String email,
                               @Param("sort") String sort, @Param("skip") int skip, @Param("size") int size);

    long selectListCount(@Param("babyNo") Long babyNo, @Param("email") String email);

    void insert(BabyAlbum babyAlbum);

    void delete(@Param("albumNo") Long albumNo, @Param("email") String email);

    void deleteByBabyNo(@Param("babyNo") Long babyNo, @Param("email") String email);

    List<String> selectPhotoFileNamesByBabyNo(@Param("babyNo") Long babyNo, @Param("email") String email);

    long countByAlbumNoAndBabyNo(@Param("albumNo") Long albumNo, @Param("babyNo") Long babyNo);

    String selectPhotoFileNameByAlbumNo(@Param("albumNo") Long albumNo, @Param("email") String email);

}