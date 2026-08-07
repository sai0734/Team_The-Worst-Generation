package com.backend.market.mapper;

import com.backend.market.domain.RentalDetail;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RentalDetailMapper {

    RentalDetail selectByItemNo(@Param("itemNo") Long itemNo);

    void insert(RentalDetail rentalDetail);

    void update(RentalDetail rentalDetail);

    void delete(@Param("itemNo") Long itemNo);

}
