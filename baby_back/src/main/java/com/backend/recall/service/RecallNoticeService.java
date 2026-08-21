package com.backend.recall.service;

import com.backend.recall.domain.MyProduct;

public interface RecallNoticeService {

    void notifyAfterCommit(MyProduct product);
}
