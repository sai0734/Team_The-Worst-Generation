package com.backend.homecam.mapper;

import com.backend.homecam.domain.HomeCamSafeZone;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface HomeCamSafeZoneMapper {

    HomeCamSafeZone selectByEmail(@Param("email") String email);

    void insert(HomeCamSafeZone zone);

    void update(HomeCamSafeZone zone);

    void updateBaseline(@Param("email") String email,
                         @Param("baselineEmbedding") String baselineEmbedding,
                         @Param("embeddingModelVersion") String embeddingModelVersion);

}
