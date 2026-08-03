package com.backend.mapper;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.backend.domain.Todo;

import lombok.extern.log4j.Log4j2;

@SpringBootTest
@Log4j2
public class TodoMapperTests {

    @Autowired
    private TodoMapper todoMapper;

    @Test
    public void test1(){

        log.info("----------------------------");
        log.info(todoMapper);
    }

  @Test
  public void testInsert() {

    for (int i = 1; i <= 100; i++) {

      Todo todo = Todo.builder()
      .title("Title..." + i)
      .dueDate(LocalDate.of(2024,12,31))
      .writer("user00")
      .build();

      todoMapper.insert(todo);
    }
  }

    @Test
  public void testModify() {

    Long tno = 100L;

    Todo todo = todoMapper.selectByTno(tno);

    todo.changeTitle("Modified 100...");
    todo.changeComplete(true);
    todo.changeDueDate(LocalDate.of(2026,06,23));

    todoMapper.update(todo);

  }


      @Test
  public void testPaging() {

    java.util.List<Todo> result = todoMapper.selectList(0, 10);

    log.info(todoMapper.selectListCount());

    result.forEach(todo -> log.info(todo));

  }
}
