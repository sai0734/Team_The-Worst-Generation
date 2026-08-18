package com.backend.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.backend.recall.domain.MyProduct;
import com.backend.recall.domain.RecallMatchType;
import com.backend.recall.mapper.MyProductMapper;

import lombok.extern.log4j.Log4j2;

@SpringBootTest
@Log4j2
public class MyProductMapperTests {

    private static final String EMAIL = "user0@aaa.com";

    @Autowired
    private MyProductMapper myProductMapper;

    @AfterEach
    public void cleanup() {
        for (MyProduct product : myProductMapper.selectByMember(EMAIL)) {
            myProductMapper.delete(product.getProductNo());
        }
    }

    @Test
    public void insert_selectOne() {

        MyProduct product = MyProduct.builder()
            .memberEmail(EMAIL)
            .productName("매퍼테스트상품")
            .brandName("브랜드")
            .modelName("모델")
            .certNum("CERT-001")
            .imageName("test.jpg")
            .build();

        myProductMapper.insert(product);

        MyProduct found = myProductMapper.selectOne(product.getProductNo());

        assertEquals("매퍼테스트상품", found.getProductName());
        assertEquals("브랜드", found.getBrandName());
        assertEquals("모델", found.getModelName());
        assertEquals("test.jpg", found.getImageName());
        assertEquals(EMAIL, found.getMemberEmail());
    }

    @Test
    public void updateRecallMatch_저장된다() {

        MyProduct product = MyProduct.builder()
            .memberEmail(EMAIL)
            .productName("매칭테스트상품")
            .build();

        myProductMapper.insert(product);

        product.markMatched(RecallMatchType.DOMESTIC, "UID-123", "테스트 리콜 제목");
        myProductMapper.updateRecallMatch(product);

        MyProduct found = myProductMapper.selectOne(product.getProductNo());

        assertTrue(found.isRecallMatched());
        assertEquals(RecallMatchType.DOMESTIC, found.getRecallType());
        assertEquals("UID-123", found.getRecallUid());
        assertEquals("테스트 리콜 제목", found.getRecallTitle());
    }

    @Test
    public void update_전체필드가_수정되고_매칭이_초기화될수있다() {

        MyProduct product = MyProduct.builder()
            .memberEmail(EMAIL)
            .productName("전체수정전상품")
            .build();

        myProductMapper.insert(product);

        product.markMatched(RecallMatchType.CERT, "CERT-999", "이전 리콜");
        myProductMapper.updateRecallMatch(product);

        product.updateFields("전체수정후상품", "새브랜드", "새모델", "새인증번호", "새이미지.jpg");
        product.resetMatch();
        myProductMapper.update(product);

        MyProduct found = myProductMapper.selectOne(product.getProductNo());

        assertEquals("전체수정후상품", found.getProductName());
        assertEquals("새브랜드", found.getBrandName());
        assertEquals("새모델", found.getModelName());
        assertEquals("새인증번호", found.getCertNum());
        assertEquals("새이미지.jpg", found.getImageName());
        assertEquals(false, found.isRecallMatched());
        assertNull(found.getRecallType());
    }

    @Test
    public void selectUnmatched_은_미확인_제품만_포함한다() {

        MyProduct unmatched = MyProduct.builder()
            .memberEmail(EMAIL)
            .productName("미확인상품")
            .build();
        myProductMapper.insert(unmatched);

        MyProduct matched = MyProduct.builder()
            .memberEmail(EMAIL)
            .productName("확인된상품")
            .build();
        myProductMapper.insert(matched);
        matched.markMatched(RecallMatchType.FOREIGN, "UID-456", "리콜됨");
        myProductMapper.updateRecallMatch(matched);

        boolean containsUnmatched = myProductMapper.selectUnmatched().stream()
            .anyMatch(p -> p.getProductNo().equals(unmatched.getProductNo()));
        boolean containsMatched = myProductMapper.selectUnmatched().stream()
            .anyMatch(p -> p.getProductNo().equals(matched.getProductNo()));

        assertTrue(containsUnmatched);
        assertEquals(false, containsMatched);
    }

    @Test
    public void delete는_소프트delete로_목록에서_제외된다() {

        MyProduct product = MyProduct.builder()
            .memberEmail(EMAIL)
            .productName("삭제테스트상품")
            .build();
        myProductMapper.insert(product);

        myProductMapper.delete(product.getProductNo());

        assertNull(myProductMapper.selectOne(product.getProductNo()));
    }
}
