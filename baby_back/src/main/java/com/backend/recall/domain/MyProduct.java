package com.backend.recall.domain;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MyProduct {

    private Long productNo;

    private String memberEmail;

    private String productName;

    private String brandName;

    private String modelName;

    private String certNum;

    private String imageName;

    private boolean recallMatched;

    private RecallMatchType recallType;

    private String recallUid;

    private String recallTitle;

    private LocalDateTime checkedTime;

    private LocalDateTime regTime;

    private boolean delFlag;

    public void markMatched(RecallMatchType type, String uid, String title) {
        this.recallMatched = true;
        this.recallType = type;
        this.recallUid = uid;
        this.recallTitle = title;
        this.checkedTime = LocalDateTime.now();
    }

    public void markChecked() {
        this.checkedTime = LocalDateTime.now();
    }

    public void updateFields(String productName, String brandName, String modelName, String certNum, String imageName) {
        this.productName = productName;
        this.brandName = brandName;
        this.modelName = modelName;
        this.certNum = certNum;
        this.imageName = imageName;
    }

    /** 정보 수정 시 이전 매칭 결과를 지우고 새 정보로 재판정할 수 있도록 초기화한다. */
    public void resetMatch() {
        this.recallMatched = false;
        this.recallType = null;
        this.recallUid = null;
        this.recallTitle = null;
    }
}
