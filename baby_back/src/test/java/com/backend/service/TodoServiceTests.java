package com.backend.service;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.backend.dto.PageRequestDTO;
import com.backend.dto.PageResponseDTO;
import com.backend.dto.TodoDTO;

import lombok.extern.log4j.Log4j2;

@SpringBootTest
@Log4j2
public class TodoServiceTests {
  
  @Autowired
  private TodoService todoService;

  @Test
  public void testRegister() {

    TodoDTO todoDTO = TodoDTO.builder()
    .title("서비스 테스트")
    .writer("tester")
    .dueDate(LocalDate.of(2026,10,10))
    .build();

    Long tno = todoService.register(todoDTO);

    log.info("TNO: " + tno);
    
  }

   @Test
  public void testList() {
    PageRequestDTO pageRequestDTO = PageRequestDTO.builder()
    .page(2)
    .size(10)
    .build();
    PageResponseDTO<TodoDTO> response = todoService.list(pageRequestDTO);
    log.info(response);
  }
}