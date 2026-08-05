package com.backend;

import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
// KYI: com.backend 전체에서 @Mapper 붙은 인터페이스만 매퍼로 등록.
// (패키지 이름을 나열하는 대신 어노테이션으로 필터링 — 이렇게 해야 Service 인터페이스가
// 매퍼로 잘못 등록되는 문제 없이, 새 매퍼는 인터페이스에 @Mapper만 붙이면 이 파일을
// 다시 고치지 않아도 자동으로 인식됨)
// 주의: 기존 매퍼(Cart/Member/Product/Todo/babyInfo 등)에도 각자 @Mapper를 붙여야
// 정상 인식됩니다. 안 붙이면 그 매퍼는 스캔 대상에서 빠집니다.
@MapperScan(basePackages = "com.backend", annotationClass = Mapper.class)
// KYI 끝
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
