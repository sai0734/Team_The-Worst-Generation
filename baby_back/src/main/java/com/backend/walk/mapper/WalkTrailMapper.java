package com.backend.walk.mapper;

import com.backend.walk.domain.WalkTrail;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface WalkTrailMapper {

    @Select("SELECT trail_no, name, description, location_name, latitude, longitude, reg_time "
            + "FROM tbl_walk_trail "
            + "WHERE latitude IS NOT NULL AND longitude IS NOT NULL")
    List<WalkTrail> selectNearbyCandidates();

    @Insert("INSERT INTO tbl_walk_trail (name, description, location_name, latitude, longitude) "
            + "VALUES (#{name}, #{description}, #{locationName}, #{latitude}, #{longitude})")
    @Options(useGeneratedKeys = true, keyProperty = "trailNo")
    void insert(WalkTrail walkTrail);
}