package com.backend.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.domain.Todo;
import com.backend.dto.PageRequestDTO;
import com.backend.dto.PageResponseDTO;
import com.backend.dto.TodoDTO;
import com.backend.mapper.TodoMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor  // 생성자 자동 주입
public class TodoServiceImpl implements TodoService {

  //자동주입 대상은 final로
  private final ModelMapper modelMapper;

  private final TodoMapper todoMapper;

  @Override
  public Long register(TodoDTO todoDTO) {

    log.info(".........");

    Todo todo = modelMapper.map(todoDTO, Todo.class);

    todoMapper.insert(todo);

    return todo.getTno();

  }

    @Override
  public TodoDTO get(Long tno) {

    Todo todo = Optional.ofNullable(todoMapper.selectByTno(tno)).orElseThrow();

    TodoDTO dto = modelMapper.map(todo, TodoDTO.class);

    return dto;
  }
    @Override
  public void modify(TodoDTO todoDTO) {

    Todo todo = Optional.ofNullable(todoMapper.selectByTno(todoDTO.getTno())).orElseThrow();

    todo.changeTitle(todoDTO.getTitle());
    todo.changeDueDate(todoDTO.getDueDate());
    todo.changeComplete(todoDTO.isComplete());

    todoMapper.update(todo);

  }

  @Override
  public void remove(Long tno) {

    todoMapper.delete(tno);

  }

    @Override
  public PageResponseDTO<TodoDTO> list(PageRequestDTO pageRequestDTO) {

    int skip = (pageRequestDTO.getPage() - 1) * pageRequestDTO.getSize(); // 1페이지가 0이므로 주의

    List<Todo> result = todoMapper.selectList(skip, pageRequestDTO.getSize());

    List<TodoDTO> dtoList = result.stream()
      .map(todo -> modelMapper.map(todo, TodoDTO.class))
      .collect(Collectors.toList());

    long totalCount = todoMapper.selectListCount();

    PageResponseDTO<TodoDTO> responseDTO = PageResponseDTO.<TodoDTO>withAll()
      .dtoList(dtoList)
      .pageRequestDTO(pageRequestDTO)
      .totalCount(totalCount)
      .build();

    return responseDTO;
  }
}
