package com.backend.babysitter.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.babysitter.domain.BabysitterParentLocation;

@Mapper
public interface BabysitterParentLocationMapper {

    BabysitterParentLocation selectByEmail(@Param("email") String email);

    void insert(BabysitterParentLocation location);

    void update(BabysitterParentLocation location);
}
