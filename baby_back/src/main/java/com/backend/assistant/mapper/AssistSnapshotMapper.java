package com.backend.assistant.mapper;

import com.backend.assistant.domain.AssistRegion;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AssistSnapshotMapper {
    AssistRegion selectRegion(@Param("email") String email);
    void upsertRegion(AssistRegion row);
    void ensureBabyMonthsColumn();
}
