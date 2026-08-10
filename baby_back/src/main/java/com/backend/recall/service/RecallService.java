package com.backend.recall.service;

import java.util.List;

import com.backend.recall.domain.CertConditionKey;
import com.backend.recall.domain.DomesticRecallConditionKey;
import com.backend.recall.domain.ForeignRecallConditionKey;
import com.backend.recall.dto.SafetyKoreaCertificationDTO;
import com.backend.recall.dto.SafetyKoreaDomesticRecallDTO;
import com.backend.recall.dto.SafetyKoreaForeignRecallDTO;

public interface RecallService {

    List<SafetyKoreaCertificationDTO> searchCertifications(CertConditionKey conditionKey, String conditionValue);

    SafetyKoreaCertificationDTO getCertificationDetail(String certNum);

    List<SafetyKoreaDomesticRecallDTO> searchDomesticRecalls(DomesticRecallConditionKey conditionKey, String conditionValue);

    SafetyKoreaDomesticRecallDTO getDomesticRecallDetail(String recallUid);

    List<SafetyKoreaForeignRecallDTO> searchForeignRecalls(ForeignRecallConditionKey conditionKey, String conditionValue);
}
