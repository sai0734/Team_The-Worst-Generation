package com.backend.recall.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.recall.domain.DomesticRecallConditionKey;
import com.backend.recall.domain.ForeignRecallConditionKey;
import com.backend.recall.domain.MyProduct;
import com.backend.recall.domain.RecallMatchType;
import com.backend.recall.dto.MyProductDTO;
import com.backend.recall.dto.SafetyKoreaCertificationDTO;
import com.backend.recall.dto.SafetyKoreaDomesticRecallDTO;
import com.backend.recall.dto.SafetyKoreaForeignRecallDTO;
import com.backend.recall.mapper.MyProductMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class MyProductServiceImpl implements MyProductService {

    private final MyProductMapper myProductMapper;

    private final RecallService recallService;

    @Override
    public MyProductDTO register(String memberEmail, MyProductDTO dto) {

        MyProduct product = MyProduct.builder()
            .memberEmail(memberEmail)
            .productName(dto.getProductName())
            .brandName(dto.getBrandName())
            .modelName(dto.getModelName())
            .certNum(dto.getCertNum())
            .build();

        myProductMapper.insert(product);

        applyMatch(product);
        myProductMapper.updateRecallMatch(product);

        return toDTO(myProductMapper.selectOne(product.getProductNo()));
    }

    @Override
    public List<MyProductDTO> listMine(String memberEmail) {

        return myProductMapper.selectByMember(memberEmail).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    public void remove(Long productNo, String memberEmail) {

        MyProduct product = myProductMapper.selectOne(productNo);

        if (product == null || !product.getMemberEmail().equals(memberEmail)) {
            throw new NoSuchElementException("등록된 제품이 없습니다.");
        }

        myProductMapper.delete(productNo);
    }

    @Override
    public void recheckAll() {

        for (MyProduct product : myProductMapper.selectUnmatched()) {
            applyMatch(product);
            myProductMapper.updateRecallMatch(product);
        }
    }

    private void applyMatch(MyProduct product) {

        try {
            if (product.getCertNum() != null && !product.getCertNum().isBlank()) {
                SafetyKoreaCertificationDTO cert = recallService.getCertificationDetail(product.getCertNum());
                if (cert != null) {
                    product.markMatched(RecallMatchType.CERT, cert.getCertNum(), cert.getProductName());
                    return;
                }
            }

            List<SafetyKoreaDomesticRecallDTO> domestic = recallService.searchDomesticRecalls(
                DomesticRecallConditionKey.recallProductName, product.getProductName()
            );

            if (!domestic.isEmpty()) {
                SafetyKoreaDomesticRecallDTO hit = domestic.get(0);
                product.markMatched(RecallMatchType.DOMESTIC, hit.getRecallUid(), hit.getRecallProductName());
                return;
            }

            List<SafetyKoreaForeignRecallDTO> foreign = recallService.searchForeignRecalls(
                ForeignRecallConditionKey.recallProductName, product.getProductName()
            );

            if (!foreign.isEmpty()) {
                SafetyKoreaForeignRecallDTO hit = foreign.get(0);
                product.markMatched(RecallMatchType.FOREIGN, hit.getFRecallUid(), hit.getRecallProductName());
                return;
            }

            product.markChecked();

        } catch (IllegalStateException e) {
            log.warn("리콜 매칭 확인 실패 (productNo={}): {}", product.getProductNo(), e.getMessage());
        }
    }

    private MyProductDTO toDTO(MyProduct product) {

        return MyProductDTO.builder()
            .productNo(product.getProductNo())
            .memberEmail(product.getMemberEmail())
            .productName(product.getProductName())
            .brandName(product.getBrandName())
            .modelName(product.getModelName())
            .certNum(product.getCertNum())
            .recallMatched(product.isRecallMatched())
            .recallType(product.getRecallType())
            .recallUid(product.getRecallUid())
            .recallTitle(product.getRecallTitle())
            .checkedTime(product.getCheckedTime())
            .regTime(product.getRegTime())
            .build();
    }
}
