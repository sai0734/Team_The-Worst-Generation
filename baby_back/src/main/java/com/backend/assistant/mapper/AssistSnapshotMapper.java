package com.backend.assistant.mapper;

import com.backend.assistant.domain.AssistRegion;
import com.backend.assistant.domain.AssistSnapshot;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AssistSnapshotMapper {
    List<String> selectRegionEmails();
    void deleteByBaby(@Param("email") String email, @Param("babyNo") Long babyNo);
    void insert(AssistSnapshot row);
    List<AssistSnapshot> selectByEmail(@Param("email") String email);
    AssistRegion selectRegion(@Param("email") String email);
    void upsertRegion(AssistRegion row);
    void ensureBabyMonthsColumn();
}
