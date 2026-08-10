package com.backend.recall.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.backend.recall.client.RecallApiClient;
import com.backend.recall.domain.CertConditionKey;
import com.backend.recall.domain.DomesticRecallConditionKey;
import com.backend.recall.domain.ForeignRecallConditionKey;
import com.backend.recall.dto.SafetyKoreaCertificationDTO;
import com.backend.recall.dto.SafetyKoreaDomesticRecallDTO;
import com.backend.recall.dto.SafetyKoreaForeignRecallDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Log4j2
@RequiredArgsConstructor
public class RecallServiceImpl implements RecallService {

    private final RecallApiClient recallApiClient;

    @Override
    public List<SafetyKoreaCertificationDTO> searchCertifications(CertConditionKey conditionKey, String conditionValue) {

        return recallApiClient.searchCertifications(conditionKey, conditionValue);
    }

    @Override
    public SafetyKoreaCertificationDTO getCertificationDetail(String certNum) {

        return recallApiClient.getCertificationDetail(certNum);
    }

    @Override
    public List<SafetyKoreaDomesticRecallDTO> searchDomesticRecalls(DomesticRecallConditionKey conditionKey, String conditionValue) {

        return recallApiClient.searchDomesticRecalls(conditionKey, conditionValue);
    }

    @Override
    public SafetyKoreaDomesticRecallDTO getDomesticRecallDetail(String recallUid) {

        return recallApiClient.getDomesticRecallDetail(recallUid);
    }

    @Override
    public List<SafetyKoreaForeignRecallDTO> searchForeignRecalls(ForeignRecallConditionKey conditionKey, String conditionValue) {

        return recallApiClient.searchForeignRecalls(conditionKey, conditionValue);
    }
}
