package com.backend.ledger.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.global.ai.OllamaClient;
import com.backend.ledger.domain.Ledger;
import com.backend.ledger.domain.LedgerCategory;
import com.backend.ledger.domain.LedgerSetting;
import com.backend.ledger.domain.LedgerType;
import com.backend.ledger.dto.LedgerBriefingDTO;
import com.backend.ledger.dto.LedgerBulkClassifyRequestDTO;
import com.backend.ledger.dto.LedgerClassifyRequestDTO;
import com.backend.ledger.dto.LedgerClassifyResponseDTO;
import com.backend.ledger.dto.LedgerDTO;
import com.backend.ledger.dto.LedgerSettingDTO;
import com.backend.ledger.dto.LedgerSummaryDTO;
import com.backend.ledger.mapper.LedgerMapper;
import com.backend.ledger.mapper.LedgerSettingMapper;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    private final LedgerMapper ledgerMapper;

    private final LedgerSettingMapper ledgerSettingMapper;

    private final OllamaClient ollamaClient;

    private record Cycle(LocalDate start, LocalDate end) {}

    @Override
    public Long register(LedgerDTO ledgerDTO) {

        Ledger ledger = Ledger.builder()
            .email(ledgerDTO.getEmail())
            .type(ledgerDTO.getType())
            .category(ledgerDTO.getCategory())
            .amount(ledgerDTO.getAmount())
            .memo(ledgerDTO.getMemo())
            .txDate(ledgerDTO.getTxDate() != null ? ledgerDTO.getTxDate() : LocalDate.now())
            .build();

        ledgerMapper.insert(ledger);

        return ledger.getLno();
    }

    @Override
    public LedgerDTO get(Long lno, String email) {

        Ledger ledger = findOwnedOrThrow(lno, email);

        return toDTO(ledger);
    }

    @Override
    public void modify(LedgerDTO ledgerDTO, String email) {

        Ledger ledger = findOwnedOrThrow(ledgerDTO.getLno(), email);

        ledger.changeType(ledgerDTO.getType());
        ledger.changeCategory(ledgerDTO.getCategory());
        ledger.changeAmount(ledgerDTO.getAmount());
        ledger.changeMemo(ledgerDTO.getMemo());
        ledger.changeTxDate(ledgerDTO.getTxDate());

        ledgerMapper.update(ledger);
    }

    @Override
    public void remove(Long lno, String email) {

        findOwnedOrThrow(lno, email);

        ledgerMapper.delete(lno);
    }

    @Override
    public List<LedgerDTO> listByRange(String email, LocalDate start, LocalDate end) {

        return ledgerMapper.selectListByEmailAndRange(email, start, end)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    public LedgerSummaryDTO getSummary(String email) {

        LedgerSetting setting = ledgerSettingMapper.selectByEmail(email);
        Integer briefingDay = setting != null ? setting.getBriefingDay() : null;

        Cycle current = computeCycle(LocalDate.now(), briefingDay);
        Cycle previous = computeCycle(current.start().minusDays(1), briefingDay);

        List<Ledger> currentEntries = ledgerMapper.selectListByEmailAndRange(email, current.start(), current.end());
        List<Ledger> previousEntries = ledgerMapper.selectListByEmailAndRange(email, previous.start(), previous.end());

        return LedgerSummaryDTO.builder()
            .cycleStart(current.start())
            .cycleEnd(current.end())
            .totalIncome(sumByType(currentEntries, LedgerType.INCOME))
            .totalExpense(sumByType(currentEntries, LedgerType.EXPENSE))
            .categoryBreakdown(breakdownByCategory(currentEntries))
            .prevCycleStart(previous.start())
            .prevCycleEnd(previous.end())
            .prevTotalIncome(sumByType(previousEntries, LedgerType.INCOME))
            .prevTotalExpense(sumByType(previousEntries, LedgerType.EXPENSE))
            .prevCategoryBreakdown(breakdownByCategory(previousEntries))
            .build();
    }

    @Override
    public LedgerSettingDTO getSetting(String email) {

        LedgerSetting setting = ledgerSettingMapper.selectByEmail(email);
        Integer briefingDay = setting != null ? setting.getBriefingDay() : null;
        LocalDate lastCycleStart = setting != null ? setting.getLastBriefingCycleStart() : null;

        Cycle current = computeCycle(LocalDate.now(), briefingDay);
        boolean briefingAvailable = !current.start().equals(lastCycleStart);

        return LedgerSettingDTO.builder()
            .email(email)
            .briefingDay(briefingDay)
            .lastBriefingCycleStart(lastCycleStart)
            .briefingAvailable(briefingAvailable)
            .build();
    }

    @Override
    public void updateBriefingDay(String email, Integer briefingDay) {

        if (briefingDay != null && (briefingDay < 1 || briefingDay > 31)) {
            throw new IllegalArgumentException("briefingDay는 1~31 사이여야 합니다.");
        }

        LedgerSetting existing = ledgerSettingMapper.selectByEmail(email);

        if (existing == null) {
            ledgerSettingMapper.insert(
                LedgerSetting.builder()
                    .email(email)
                    .briefingDay(briefingDay)
                    .build()
            );
        } else {
            ledgerSettingMapper.updateBriefingDay(email, briefingDay);
        }
    }

    @Override
    public LedgerClassifyResponseDTO classify(LedgerClassifyRequestDTO requestDTO) {

        String categoryList = String.join(", ",
            java.util.Arrays.stream(LedgerCategory.values()).map(Enum::name).toArray(String[]::new));

        String prompt = """
            아래 가계부 입력 문장에서 금액, 수입/지출 여부, 카테고리, 항목명을 추출해줘.
            카테고리는 반드시 다음 목록 중 하나로만 골라줘: %s
            type은 INCOME 또는 EXPENSE 중 하나로만 답해줘.
            description은 금액과 통화 단위(원, 만원 등)를 뺀 순수한 항목 이름이야.
            설명 없이 아래 형식의 JSON 객체만 출력해줘.
            {"type": "EXPENSE", "category": "FOOD", "amount": 23000, "description": "치킨"}
            amount를 문장에서 찾을 수 없으면 null로 해줘.

            입력 문장: %s
            """.formatted(categoryList, requestDTO.getMemo());

        String raw = ollamaClient.chat(prompt);
        JsonObject json = parseJsonObject(raw);

        return toClassifyResponse(json);
    }

    @Override
    public List<LedgerClassifyResponseDTO> classifyBulk(LedgerBulkClassifyRequestDTO requestDTO) {

        List<String> memos = requestDTO.getMemos();

        if (memos == null || memos.isEmpty()) {
            return List.of();
        }

        String categoryList = String.join(", ",
            java.util.Arrays.stream(LedgerCategory.values()).map(Enum::name).toArray(String[]::new));

        StringBuilder numberedLines = new StringBuilder();
        for (int i = 0; i < memos.size(); i++) {
            numberedLines.append(i + 1).append(". ").append(memos.get(i)).append("\n");
        }

        String prompt = """
            아래는 사용자가 한 번에 입력한 여러 개의 가계부 기록 문장이야. 줄마다 금액, 수입/지출 여부, 카테고리, 항목명을 추출해줘.
            카테고리는 반드시 다음 목록 중 하나로만 골라줘: %s
            type은 INCOME 또는 EXPENSE 중 하나로만 답해줘.
            description은 금액과 통화 단위(원, 만원 등)를 뺀 순수한 항목 이름이야.
            설명 없이, 입력된 줄과 같은 개수·순서로 JSON 배열만 출력해줘.
            각 원소는 {"type": "EXPENSE", "category": "FOOD", "amount": 23000, "description": "치킨"} 형식이야.
            amount를 문장에서 찾을 수 없으면 null로 해줘.

            입력 (%d줄):
            %s
            """.formatted(categoryList, memos.size(), numberedLines);

        String raw = ollamaClient.chat(prompt);
        JsonArray jsonArray = parseJsonArray(raw);

        List<LedgerClassifyResponseDTO> results = new java.util.ArrayList<>();

        for (int i = 0; i < memos.size(); i++) {
            if (i >= jsonArray.size()) {
                results.add(fallbackClassifyResponse(memos.get(i)));
                continue;
            }

            try {
                JsonObject item = jsonArray.get(i).getAsJsonObject();
                results.add(toClassifyResponse(item));
            } catch (Exception e) {
                log.warn("가계부 일괄 분류 중 항목 파싱 실패 (index={}): {}", i, e.getMessage());
                results.add(fallbackClassifyResponse(memos.get(i)));
            }
        }

        return results;
    }

    private LedgerClassifyResponseDTO toClassifyResponse(JsonObject json) {

        LedgerType type = LedgerType.valueOf(json.get("type").getAsString());
        LedgerCategory category = LedgerCategory.valueOf(json.get("category").getAsString());
        Integer amount = (json.has("amount") && !json.get("amount").isJsonNull())
            ? json.get("amount").getAsInt()
            : null;
        String description = (json.has("description") && !json.get("description").isJsonNull())
            ? json.get("description").getAsString()
            : null;

        return LedgerClassifyResponseDTO.builder()
            .type(type)
            .category(category)
            .amount(amount)
            .description(description)
            .build();
    }

    private LedgerClassifyResponseDTO fallbackClassifyResponse(String memo) {

        return LedgerClassifyResponseDTO.builder()
            .type(LedgerType.EXPENSE)
            .category(LedgerCategory.ETC)
            .amount(null)
            .description(memo)
            .build();
    }

    @Override
    public LedgerBriefingDTO generateBriefing(String email) {

        LedgerSummaryDTO stats = getSummary(email);

        String prompt = """
            아래는 사용자의 가계부 데이터야. 이번 기간과 저번 기간을 비교해서
            친근한 말투로 2~3문장짜리 짧은 브리핑을 작성해줘. 숫자는 원 단위로 표현해줘.

            이번 기간(%s ~ %s): 수입 %d원, 지출 %d원
            저번 기간(%s ~ %s): 수입 %d원, 지출 %d원
            이번 기간 카테고리별 지출: %s
            """.formatted(
                stats.getCycleStart(), stats.getCycleEnd(), stats.getTotalIncome(), stats.getTotalExpense(),
                stats.getPrevCycleStart(), stats.getPrevCycleEnd(), stats.getPrevTotalIncome(), stats.getPrevTotalExpense(),
                stats.getCategoryBreakdown()
            );

        String summary = ollamaClient.chat(prompt);

        LedgerSetting setting = ledgerSettingMapper.selectByEmail(email);
        if (setting == null) {
            ledgerSettingMapper.insert(
                LedgerSetting.builder()
                    .email(email)
                    .lastBriefingCycleStart(stats.getCycleStart())
                    .build()
            );
        } else {
            ledgerSettingMapper.updateLastBriefingCycleStart(email, stats.getCycleStart());
        }

        return LedgerBriefingDTO.builder()
            .summary(summary)
            .stats(stats)
            .generatedAt(LocalDateTime.now())
            .build();
    }

    // ---------- 내부 헬퍼 ----------

    private Ledger findOwnedOrThrow(Long lno, String email) {

        Ledger ledger = Optional.ofNullable(ledgerMapper.selectByLno(lno)).orElseThrow();

        if (!ledger.getEmail().equals(email)) {
            throw new NoSuchElementException("해당 가계부 기록을 찾을 수 없습니다.");
        }

        return ledger;
    }

    private LedgerDTO toDTO(Ledger ledger) {

        return LedgerDTO.builder()
            .lno(ledger.getLno())
            .email(ledger.getEmail())
            .type(ledger.getType())
            .category(ledger.getCategory())
            .amount(ledger.getAmount())
            .memo(ledger.getMemo())
            .txDate(ledger.getTxDate())
            .regTime(ledger.getRegTime())
            .build();
    }

    private int sumByType(List<Ledger> entries, LedgerType type) {

        return entries.stream()
            .filter(e -> e.getType() == type)
            .mapToInt(Ledger::getAmount)
            .sum();
    }

    private Map<LedgerCategory, Integer> breakdownByCategory(List<Ledger> entries) {

        Map<LedgerCategory, Integer> result = new EnumMap<>(LedgerCategory.class);

        for (Ledger entry : entries) {
            result.merge(entry.getCategory(), entry.getAmount(), Integer::sum);
        }

        return result;
    }

    private JsonObject parseJsonObject(String raw) {

        String trimmed = raw.trim();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');

        if (start == -1 || end == -1 || end < start) {
            throw new IllegalStateException("AI 응답에서 JSON을 찾을 수 없습니다: " + raw);
        }

        return JsonParser.parseString(trimmed.substring(start, end + 1)).getAsJsonObject();
    }

    private JsonArray parseJsonArray(String raw) {

        String trimmed = raw.trim();
        int start = trimmed.indexOf('[');
        int end = trimmed.lastIndexOf(']');

        if (start == -1 || end == -1 || end < start) {
            throw new IllegalStateException("AI 응답에서 JSON 배열을 찾을 수 없습니다: " + raw);
        }

        JsonElement parsed = JsonParser.parseString(trimmed.substring(start, end + 1));

        return parsed.getAsJsonArray();
    }

    private Cycle computeCycle(LocalDate reference, Integer briefingDay) {

        if (briefingDay == null) {
            LocalDate start = reference.withDayOfMonth(1);
            LocalDate end = start.plusMonths(1).minusDays(1);
            return new Cycle(start, end);
        }

        int day = Math.min(briefingDay, reference.lengthOfMonth());
        LocalDate anchorThisMonth = reference.withDayOfMonth(day);

        LocalDate start = reference.isBefore(anchorThisMonth)
            ? anchorThisMonth.minusMonths(1).withDayOfMonth(Math.min(briefingDay, anchorThisMonth.minusMonths(1).lengthOfMonth()))
            : anchorThisMonth;

        LocalDate end = start.plusMonths(1).minusDays(1);

        return new Cycle(start, end);
    }
}
