package com.backend.market.mapper;

import com.backend.market.domain.MarketProfile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MarketProfileMapper {

    MarketProfile selectByEmail(@Param("email") String email);

    void insert(MarketProfile profile);

    void update(MarketProfile profile);

}
