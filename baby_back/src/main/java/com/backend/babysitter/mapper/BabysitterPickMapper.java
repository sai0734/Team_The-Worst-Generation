package com.backend.babysitter.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.babysitter.domain.BabysitterPick;

@Mapper
public interface BabysitterPickMapper {

    BabysitterPick selectOne(
        @Param("sitterEmail") String sitterEmail,
        @Param("pickerEmail") String pickerEmail
    );

    long countBySitter(@Param("sitterEmail") String sitterEmail);

    void insert(BabysitterPick pick);

    void delete(
        @Param("sitterEmail") String sitterEmail,
        @Param("pickerEmail") String pickerEmail
    );
}
