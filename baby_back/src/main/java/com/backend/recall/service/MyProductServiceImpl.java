package com.backend.recall.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.function.Function;
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

        String productName = trimToNull(dto.getProductName());
        if (productName == null) {
            throw new IllegalArgumentException("제품명을 입력해주세요.");
        }

        String brandName = trimToNull(dto.getBrandName());
        String modelName = trimToNull(dto.getModelName());
        String certNum = trimToNull(dto.getCertNum());

        requireDistinguishingInfo(brandName, modelName, certNum);

        if (isDuplicate(memberEmail, productName, modelName)) {
            throw new IllegalArgumentException("이미 등록된 제품입니다.");
        }

        MyProduct product = MyProduct.builder()
            .memberEmail(memberEmail)
            .productName(productName)
            .brandName(brandName)
            .modelName(modelName)
            .certNum(certNum)
            .imageName(trimToNull(dto.getImageName()))
            .build();

        myProductMapper.insert(product);

        applyMatch(product);
        myProductMapper.updateRecallMatch(product);

        return toDTO(myProductMapper.selectOne(product.getProductNo()));
    }

    @Override
    public MyProductDTO update(Long productNo, String memberEmail, MyProductDTO dto) {

        MyProduct product = myProductMapper.selectOne(productNo);

        if (product == null || !product.getMemberEmail().equals(memberEmail)) {
            throw new NoSuchElementException("등록된 제품이 없습니다.");
        }

        String productName = trimToNull(dto.getProductName());
        if (productName == null) {
            throw new IllegalArgumentException("제품명을 입력해주세요.");
        }

        String brandName = trimToNull(dto.getBrandName());
        String modelName = trimToNull(dto.getModelName());
        String certNum = trimToNull(dto.getCertNum());

        requireDistinguishingInfo(brandName, modelName, certNum);

        if (isDuplicate(memberEmail, productName, modelName, productNo)) {
            throw new IllegalArgumentException("이미 등록된 제품입니다.");
        }

        product.updateFields(productName, brandName, modelName, certNum, trimToNull(dto.getImageName()));
        product.resetMatch();

        applyMatch(product);
        myProductMapper.update(product);

        return toDTO(myProductMapper.selectOne(productNo));
    }

    /**
     * 제품명만으로는 SafetyKorea의 카테고리성 리콜 데이터와 정확히 대조할 수 없으므로,
     * 브랜드명·모델명·인증번호 중 최소 하나는 반드시 입력하도록 강제한다.
     */
    private void requireDistinguishingInfo(String brandName, String modelName, String certNum) {
        if (brandName == null && modelName == null && certNum == null) {
            throw new IllegalArgumentException("정확한 리콜 확인을 위해 브랜드명, 모델명, 인증번호 중 하나는 입력해주세요.");
        }
    }

    /** 같은 사용자가 제품명+모델명이 동일한 제품을 이미 등록했는지 확인 (더블클릭 등으로 인한 중복 등록 방지). */
    private boolean isDuplicate(String memberEmail, String productName, String modelName) {
        return isDuplicate(memberEmail, productName, modelName, null);
    }

    private boolean isDuplicate(String memberEmail, String productName, String modelName, Long excludeProductNo) {
        return myProductMapper.selectByMember(memberEmail).stream()
            .filter(p -> excludeProductNo == null || !p.getProductNo().equals(excludeProductNo))
            .anyMatch(p -> productName.equals(p.getProductName())
                && java.util.Objects.equals(modelName, p.getModelName()));
    }

    private String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
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
                if (cert != null && isCancelledCertState(cert.getCertState())) {
                    product.markMatched(RecallMatchType.CERT, cert.getCertNum(), cert.getProductName());
                    return;
                }
            }

            List<SafetyKoreaDomesticRecallDTO> domestic = recallService.searchDomesticRecalls(
                DomesticRecallConditionKey.recallProductName, product.getProductName()
            );

            SafetyKoreaDomesticRecallDTO domesticHit = findBestMatch(
                product, domestic,
                SafetyKoreaDomesticRecallDTO::getRecallModelName,
                SafetyKoreaDomesticRecallDTO::getRecallBrandName
            );

            if (domesticHit != null) {
                product.markMatched(RecallMatchType.DOMESTIC, domesticHit.getRecallUid(), domesticHit.getRecallProductName());
                return;
            }

            List<SafetyKoreaForeignRecallDTO> foreign = recallService.searchForeignRecalls(
                ForeignRecallConditionKey.recallProductName, product.getProductName()
            );

            SafetyKoreaForeignRecallDTO foreignHit = findBestMatch(
                product, foreign,
                SafetyKoreaForeignRecallDTO::getRecallModelName,
                SafetyKoreaForeignRecallDTO::getRecallBrandName
            );

            if (foreignHit != null) {
                product.markMatched(RecallMatchType.FOREIGN, foreignHit.getFRecallUid(), foreignHit.getRecallProductName());
                return;
            }

            product.markChecked();

        } catch (IllegalStateException e) {
            log.warn("리콜 매칭 확인 실패 (productNo={}): {}", product.getProductNo(), e.getMessage());
        }
    }

    /**
     * SafetyKorea certState는 "적합", "기간만료", "반납", "청문실시" 등 다양한 값을 반환하며,
     * 이 중 실제로 인증이 취소된 경우만 "취소"라는 문구를 포함한다 (예: "취소", "안전인증취소").
     * "기간만료"(단순 갱신 미신고) 등은 리콜과 무관하므로 매칭 대상에서 제외한다.
     */
    private boolean isCancelledCertState(String certState) {
        return certState != null && certState.contains("취소");
    }

    /**
     * SafetyKorea 국내/해외 리콜 API의 recallProductName은 "유모차"처럼 카테고리성 일반명사인 경우가
     * 많아, 제품명만으로는 서로 다른 브랜드/모델의 리콜을 구분할 수 없다. 사용자가 모델명(우선) 또는
     * 브랜드명을 입력했다면 그 값이 실제로 포함된 검색결과만 매칭으로 인정하고, 둘 다 없다면(구분할
     * 정보가 전혀 없는 경우) 기존처럼 첫 번째 검색결과를 사용한다.
     */
    private <T> T findBestMatch(
        MyProduct product,
        List<T> candidates,
        Function<T, String> modelExtractor,
        Function<T, String> brandExtractor
    ) {
        if (candidates.isEmpty()) {
            return null;
        }

        String model = normalize(product.getModelName());
        if (model != null) {
            return candidates.stream()
                .filter(c -> textMatches(model, normalize(modelExtractor.apply(c))))
                .findFirst()
                .orElse(null);
        }

        String brand = normalize(product.getBrandName());
        if (brand != null) {
            return candidates.stream()
                .filter(c -> textMatches(brand, normalize(brandExtractor.apply(c))))
                .findFirst()
                .orElse(null);
        }

        return candidates.get(0);
    }

    private String normalize(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim().toLowerCase().replaceAll("\\s+", "");
        return t.isEmpty() ? null : t;
    }

    private boolean textMatches(String a, String b) {
        return a != null && b != null && (a.contains(b) || b.contains(a));
    }

    private MyProductDTO toDTO(MyProduct product) {

        return MyProductDTO.builder()
            .productNo(product.getProductNo())
            .memberEmail(product.getMemberEmail())
            .productName(product.getProductName())
            .brandName(product.getBrandName())
            .modelName(product.getModelName())
            .certNum(product.getCertNum())
            .imageName(product.getImageName())
            .recallMatched(product.isRecallMatched())
            .recallType(product.getRecallType())
            .recallUid(product.getRecallUid())
            .recallTitle(product.getRecallTitle())
            .checkedTime(product.getCheckedTime())
            .regTime(product.getRegTime())
            .build();
    }
}
