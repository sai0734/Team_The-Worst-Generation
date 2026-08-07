package com.backend.service;

import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.dto.TodoDTO;

public interface TodoService {
    
    Long register(TodoDTO todoDTO);

    TodoDTO get(Long tno);

    void modify(TodoDTO todoDTO);

    void remove(Long tno);

     PageResponseDTO<TodoDTO> list(PageRequestDTO pageRequestDTO);
}