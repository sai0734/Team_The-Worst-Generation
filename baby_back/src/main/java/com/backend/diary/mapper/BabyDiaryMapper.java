package com.backend.diary.mapper;

import com.backend.diary.domain.BabyDiary;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabyDiaryMapper {

    List<BabyDiary> selectList(@Param("babyNo") Long babyNo, @Param("email") String email,
                               @Param("skip") int skip, @Param("size") int size);

    long selectListCount(@Param("babyNo") Long babyNo, @Param("email") String email);

    BabyDiary selectByDiaryNo(@Param("diaryNo") Long diaryNo, @Param("email") String email);

    void insert (BabyDiary babyDiary);

    void update (@Param("diary")BabyDiary babyDiary, @Param("email") String email);

    void delete (@Param("diaryNo") Long diaryNo, @Param("email") String email);

    void deleteByBabyNo(@Param("babyNo") Long babyNo, @Param("email") String email);

}
