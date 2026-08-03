package com.backend.domain;

import java.time.LocalDate;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Todo {

  private Long tno;
  
  private String title;

  private String writer;

  private boolean complete;

  private LocalDate dueDate;

    public void changeTitle(String title){
    this.title = title;
  }

  public void changeComplete(boolean complete){
    this.complete = complete;
  }

  public void changeDueDate(LocalDate dueDate){
    this.dueDate = dueDate;
  }

}