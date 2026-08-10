package com.backend.babysitter.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.backend.babysitter.domain.BabysitterReview;

@Mapper
public interface BabysitterReviewMapper {

    BabysitterReview selectByRequestNo(@Param("requestNo") Long requestNo);

    List<BabysitterReview> selectListBySitter(@Param("sitterEmail") String sitterEmail);

    Double selectAverageRatingBySitter(@Param("sitterEmail") String sitterEmail);

    long countBySitter(@Param("sitterEmail") String sitterEmail);

    void insert(BabysitterReview review);
}
