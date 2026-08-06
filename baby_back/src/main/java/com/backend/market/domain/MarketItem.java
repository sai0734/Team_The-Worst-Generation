package com.backend.market.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 매물(당근마켓 스타일). 매매형/대여형 공통. tradeType으로만 구분.
// 기존 com.backend.domain.Product와는 완전히 별개 (테이블도 tbl_market_item으로 새로 둘 예정)
@Getter
@Builder
@ToString(exclude = "imageList")
@AllArgsConstructor
@NoArgsConstructor
public class MarketItem {

    private Long itemNo;

    private String sellerEmail; // tbl_member.email 참조 (Java 레벨 의존성은 없음, 값만 이메일 문자열)

    private String title;

    private int price;

    private String description;

    private String tradeType; // SALE | RENTAL

    private String category; // 유모차/카시트/아기띠/장난감/수유용품/의류

    private String ageRange; // 예: "0~6개월"

    private String condition; // 새상품급/사용감적음/사용감있음/하자있음

    private boolean allowOffer;

    private String status; // 거래가능 | 거래완료 (매매/대여 공통, 중간상태 없음 - 판매자/대여자가 알아서 판단해서 거래완료로만 전환)

    private String locationName;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private int viewCount;

    // 리콜 관련: 필드만 두고 실제 조회 로직은 아직 연결 안 함 (리콜 담당자 기능 완성 후 연동 예정)
    private boolean recallChecked;

    private boolean recallFlag;

    private LocalDateTime bumpAt;

    private boolean delFlag;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    @Builder.Default
    private List<MarketItemImage> imageList = new ArrayList<>();

    public void changeTitle(String title) {
        this.title = title;
    }

    public void changePrice(int price) {
        this.price = price;
    }

    public void changeDescription(String description) {
        this.description = description;
    }

    public void changeStatus(String status) {
        this.status = status;
    }

    public void changeAllowOffer(boolean allowOffer) {
        this.allowOffer = allowOffer;
    }

    public void changeDel(boolean delFlag) {
        this.delFlag = delFlag;
    }

    public void increaseViewCount() {
        this.viewCount++;
    }

    public void bump() {
        this.bumpAt = LocalDateTime.now();
    }

    public void changeRecallInfo(boolean recallChecked, boolean recallFlag) {
        this.recallChecked = recallChecked;
        this.recallFlag = recallFlag;
    }

    public void addImage(MarketItemImage image) {
        image.setOrd(this.imageList.size());
        imageList.add(image);
    }

    public void addImageString(String fileName) {
        MarketItemImage image = MarketItemImage.builder()
                .fileName(fileName)
                .build();
        addImage(image);
    }

    public void clearImageList() {
        this.imageList.clear();
    }
}
