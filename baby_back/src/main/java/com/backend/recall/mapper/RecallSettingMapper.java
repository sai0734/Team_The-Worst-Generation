package com.backend.recall.mapper;

import com.backend.recall.domain.RecallSetting;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RecallSettingMapper {

    RecallSetting selectByEmail(@Param("email") String email);

    void insert(RecallSetting setting);

    void updatePhone(@Param("email") String email, @Param("notificationPhone") String notificationPhone);
}
