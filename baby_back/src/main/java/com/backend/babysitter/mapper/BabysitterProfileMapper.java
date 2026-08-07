package com.backend.babysitter.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.babysitter.domain.BabysitterAvailability;
import com.backend.babysitter.domain.BabysitterProfile;
import com.backend.babysitter.dto.BabysitterSearchDTO;

@Mapper
public interface BabysitterProfileMapper {

    BabysitterProfile selectByEmail(@Param("email") String email);

    void insert(BabysitterProfile profile);

    void update(BabysitterProfile profile);

    void delete(@Param("email") String email);

    List<BabysitterProfile> selectList(
        @Param("search") BabysitterSearchDTO search,
        @Param("skip") int skip
    );

    long selectListCount(@Param("search") BabysitterSearchDTO search);

    List<BabysitterAvailability> selectAvailability(@Param("email") String email);

    void insertAvailability(BabysitterAvailability availability);

    void deleteAvailability(@Param("email") String email);
}
