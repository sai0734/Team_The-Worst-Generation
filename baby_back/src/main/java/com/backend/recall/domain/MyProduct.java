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
}
