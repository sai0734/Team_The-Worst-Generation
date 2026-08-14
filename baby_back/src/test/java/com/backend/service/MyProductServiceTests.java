package com.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.backend.recall.domain.RecallMatchType;
import com.backend.recall.dto.MyProductDTO;
import com.backend.recall.mapper.MyProductMapper;
import com.backend.recall.service.MyProductService;

import lombok.extern.log4j.Log4j2;

/**
 * SafetyKorea 실제 API를 대상으로 동작하는 통합 테스트.
 * 이번 세션에서 고친 리콜 매칭 회귀 버그(인증상태 오탐, 카테고리명 오매칭)를
 * 실제 SafetyKorea 데이터로 재현/검증한다.
 */
@SpringBootTest
@Log4j2
public class MyProductServiceTests {

    private static final String EMAIL = "user0@aaa.com";

    @Autowired
    private MyProductService myProductService;

    @Autowired
    private MyProductMapper myProductMapper;

    @AfterEach
    public void cleanup() {
        for (MyProductDTO dto : myProductService.listMine(EMAIL)) {
            myProductMapper.delete(dto.getProductNo());
        }
    }

    @Test
    public void 인증취소된_certNum은_리콜로_매칭된다() {

        MyProductDTO dto = MyProductDTO.builder()
            .productName("테스트_인증취소상품")
            .certNum("HU073012-22003C")
            .build();

        MyProductDTO result = myProductService.register(EMAIL, dto);

        assertTrue(result.isRecallMatched());
        assertEquals(RecallMatchType.CERT, result.getRecallType());
    }

    @Test
    public void 유효한_certNum은_리콜로_매칭되지_않는다() {

        MyProductDTO dto = MyProductDTO.builder()
            .productName("테스트_유효인증상품")
            .certNum("CB131R367-6002")
            .build();

        MyProductDTO result = myProductService.register(EMAIL, dto);

        assertFalse(result.isRecallMatched());
    }

    @Test
    public void 모델명이_실제_리콜모델과_일치하면_매칭된다() {

        MyProductDTO dto = MyProductDTO.builder()
            .productName("유모차")
            .modelName("맘마카트 데일리")
            .build();

        MyProductDTO result = myProductService.register(EMAIL, dto);

        assertTrue(result.isRecallMatched());
        assertEquals(RecallMatchType.DOMESTIC, result.getRecallType());
    }

    @Test
    public void 모델명이_실제_리콜모델과_다르면_매칭되지_않는다() {

        MyProductDTO dto = MyProductDTO.builder()
            .productName("유모차")
            .modelName("존재하지않는가상모델명123")
            .build();

        MyProductDTO result = myProductService.register(EMAIL, dto);

        assertFalse(result.isRecallMatched());
    }

    @Test
    public void 같은_제품명과_모델명을_중복등록하면_예외가_발생한다() {

        MyProductDTO dto = MyProductDTO.builder()
            .productName("중복테스트상품")
            .modelName("모델A")
            .build();

        myProductService.register(EMAIL, dto);

        assertThrows(IllegalArgumentException.class, () -> myProductService.register(EMAIL, dto));
    }

    @Test
    public void 제품명이_비어있으면_예외가_발생한다() {

        MyProductDTO dto = MyProductDTO.builder()
            .productName("   ")
            .build();

        assertThrows(IllegalArgumentException.class, () -> myProductService.register(EMAIL, dto));
    }

    @Test
    public void 수정하면_이전_매칭결과가_초기화되고_새_정보로_재판정된다() {

        MyProductDTO registered = myProductService.register(EMAIL,
            MyProductDTO.builder().productName("수정테스트상품").modelName("존재하지않는가상모델명123").build());

        assertFalse(registered.isRecallMatched());

        MyProductDTO matched = myProductService.update(registered.getProductNo(), EMAIL,
            MyProductDTO.builder()
                .productName("유모차")
                .modelName("맘마카트 데일리")
                .build());

        assertTrue(matched.isRecallMatched());
        assertEquals(RecallMatchType.DOMESTIC, matched.getRecallType());

        MyProductDTO unmatchedAgain = myProductService.update(registered.getProductNo(), EMAIL,
            MyProductDTO.builder()
                .productName("다시안전한상품")
                .modelName("존재하지않는가상모델명456")
                .build());

        assertFalse(unmatchedAgain.isRecallMatched());
        assertEquals(null, unmatchedAgain.getRecallType());
    }

    @Test
    public void 내가_등록한_제품만_조회된다() {

        myProductService.register(EMAIL,
            MyProductDTO.builder().productName("목록테스트상품").modelName("테스트모델").build());

        List<MyProductDTO> list = myProductService.listMine(EMAIL);

        assertTrue(list.stream().allMatch(p -> EMAIL.equals(p.getMemberEmail())));
    }

    @Test
    public void 구분정보가_전혀_없으면_예외가_발생한다() {

        MyProductDTO dto = MyProductDTO.builder()
            .productName("구분정보없는상품")
            .build();

        assertThrows(IllegalArgumentException.class, () -> myProductService.register(EMAIL, dto));
    }
}
