package com.backend.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.backend.domain.Todo;

public interface TodoMapper {

  List<Todo> selectList(@Param("skip") int skip, @Param("size") int size);

  long selectListCount();

  Todo selectByTno(@Param("tno") Long tno);

  void insert(Todo todo);

  void update(Todo todo);

  void delete(@Param("tno") Long tno);

}
