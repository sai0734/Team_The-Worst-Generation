package com.backend.market.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MarketItemDTO {

    private Long itemNo;

    private String sellerEmail;

    private String title;

    private int price;

    private String description;

    private String tradeType; // SALE | RENTAL

    private String category;

    private String ageRange;

    private String condition;

    private boolean allowOffer;

    private String status; // 거래가능 | 거래완료

    private String locationName;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private int viewCount;

    private boolean recallChecked;

    private boolean recallFlag;

    private LocalDateTime bumpAt;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    // tradeType == RENTAL 인 경우에만 사용 (tbl_rental_detail 왕복용)
    private Integer deposit;

    private Integer minDays;

    private Integer maxDays;

    // 등록/수정 요청 시 업로드하는 파일 (컨트롤러에서만 사용, DB에는 저장 안 함)
    @Builder.Default
    private List<MultipartFile> files = new ArrayList<>();

    // 응답 시 내려주는 저장된 파일명 목록
    @Builder.Default
    private List<String> uploadFileNames = new ArrayList<>();

}
