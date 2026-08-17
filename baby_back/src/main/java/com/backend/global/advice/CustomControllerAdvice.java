package com.backend.global.advice;

import java.util.Map;
import java.util.NoSuchElementException;

import com.backend.family.exception.FamilyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.backend.global.util.CustomJWTException;

/**
 * CustomControllerAdvice
 */
@RestControllerAdvice
public class CustomControllerAdvice {


  @ExceptionHandler(NoSuchElementException.class)
  protected ResponseEntity<?> notExist(NoSuchElementException e) {

      String msg = e.getMessage();

      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", msg));
  }

    @ExceptionHandler(IllegalArgumentException.class)
    protected ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e) {

        String msg = e.getMessage();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("msg", msg));
    }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  protected ResponseEntity<?> handleIllegalArgumentException(MethodArgumentNotValidException e) {

      String msg = e.getMessage();

      return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body(Map.of("msg", msg));
  }

      @ExceptionHandler(CustomJWTException.class)
  protected ResponseEntity<?> handleJWTException(CustomJWTException e) {

      String msg = e.getMessage();

      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", msg));
  }
    @ExceptionHandler(FamilyException.class)
    protected ResponseEntity<?> handleFamilyException(FamilyException e) {

        return ResponseEntity
                .status(e.getErrorCode().getStatus())
                .body(Map.of("error", e.getErrorCode().name()));
    }
}
