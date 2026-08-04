package com.backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
// KYI: 기능별 하위 패키지의 매퍼 인터페이스도 스캔 대상에 추가
// (com.backend 전체를 스캔하면 Service 인터페이스까지 매퍼로 잘못 등록되어 빈 충돌이 남 — 패키지를 각각 명시)
@MapperScan({"com.backend.mapper", "com.backend.ledger.mapper", "com.backend.babyInfo.mapper"})
// KYI 끝
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
