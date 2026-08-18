package com.backend.sleep.service;

import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.global.ai.OllamaClient;
import com.backend.sleep.domain.BabySleep;
import com.backend.sleep.dto.BabySleepDTO;
import com.backend.sleep.mapper.BabySleepMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.TreeMap;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class BabySleepServiceImpl implements BabySleepService {

    private final BabySleepMapper babySleepMapper;

    private final BabyInfoMapper babyInfoMapper;

    private final OllamaClient ollamaClient;

    private final ModelMapper modelMapper;

    @Override
    public List<BabySleepDTO> getList(Long babyNo, String email) {

        log.info("babySleep_Service_getList_실행~~~~~~~~~~~~");

        List<BabySleep> result = babySleepMapper.selectList(babyNo, email);

        List<BabySleepDTO> babySleepDTOList = result.stream()
                .map(sleep -> modelMapper.map(sleep, BabySleepDTO.class))
                .collect(Collectors.toList());

        return babySleepDTOList;

    }

    @Override
    public Long register(BabySleepDTO babySleepDTO, String email) {

        log.info("babySleep_Service_register_실행~~~~~~~~~~~~");

        if (babyInfoMapper.selectByBabyNo(babySleepDTO.getBabyNo(), email) == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babySleepDTO.getBabyNo());
        }

        validateSleepTimeRange(babySleepDTO.getStartTime(), babySleepDTO.getEndTime());

        BabySleep babySleep = modelMapper.map(babySleepDTO, BabySleep.class);

        babySleepMapper.insert(babySleep);

        return babySleep.getSleepNo();

    }

    @Override
    public void modify(BabySleepDTO babySleepDTO, String email) {

        log.info("babySleep_Service_modify_실행~~~~~~~~~~~~");

        BabySleep babySleep = babySleepMapper.selectBySleepNo(babySleepDTO.getSleepNo(), email);

        if (babySleep == null) {
            throw new IllegalArgumentException("존재하지 않는 수면기록입니다: " + babySleepDTO.getSleepNo());
        }

        validateSleepTimeRange(babySleepDTO.getStartTime(), babySleepDTO.getEndTime());

        babySleep.changeSleepType(babySleepDTO.getSleepType());
        babySleep.changeStartTime(babySleepDTO.getStartTime());
        babySleep.changeEndTime(babySleepDTO.getEndTime());

        babySleepMapper.update(babySleep, email);

    }

    @Override
    public void remove(Long sleepNo, String email) {

        log.info("babySleep_Service_remove_실행~~~~~~~~~~~~");

        BabySleep babySleep = babySleepMapper.selectBySleepNo(sleepNo, email);

        if (babySleep == null) {
            throw new IllegalArgumentException("존재하지 않는 수면기록입니다: " + sleepNo);
        }

        babySleepMapper.delete(sleepNo, email);

    }

    @Override
    public String getSleepAdvice(Long babyNo, String email) {

        log.info("babySleep_Service_getSleepAdvice_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(babyNo, email);

        if (babyInfo == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyNo);
        }

        long ageInMonths = ChronoUnit.MONTHS.between(babyInfo.getBirthDate(), LocalDate.now());

        List<BabySleep> allSleep = babySleepMapper.selectList(babyNo, email);

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(6);

        Map<LocalDate, int[]> dailyMinutes = new TreeMap<>();
        for (LocalDate date = startDate; !date.isAfter(today); date = date.plusDays(1)) {
            dailyMinutes.put(date, new int[]{0, 0});
        }

        Set<LocalDate> recordedDates = new HashSet<>();

        for (BabySleep sleep : allSleep) {
            LocalDate date = sleep.getStartTime().toLocalDate();

            if (date.isBefore(startDate) || date.isAfter(today)) {
                continue;
            }

            recordedDates.add(date);

            LocalDateTime end = sleep.getEndTime() != null ? sleep.getEndTime() : LocalDateTime.now();
            long minutes = Duration.between(sleep.getStartTime(), end).toMinutes();

            int[] totals = dailyMinutes.get(date);
            if ("낮잠".equals(sleep.getSleepType())) {
                totals[0] += (int) minutes;
            } else {
                totals[1] += (int) minutes;
            }
        }

        StringBuilder summary = new StringBuilder();
        for (Map.Entry<LocalDate, int[]> entry : dailyMinutes.entrySet()) {
            LocalDate date = entry.getKey();

            if (!recordedDates.contains(date)) {
                summary.append(date).append(": 기록 없음\n");
                continue;
            }

            int nap = entry.getValue()[0];
            int night = entry.getValue()[1];
            summary.append(date)
                    .append(": 낮잠 ").append(nap / 60).append("시간 ").append(nap % 60).append("분, ")
                    .append("밤잠 ").append(night / 60).append("시간 ").append(night % 60).append("분\n");
        }

        String prompt = """
                너는 육아 지원 서비스의 수면 코치야.
                아래는 생후 %d개월 아기의 최근 7일간 수면 기록이야.
                "기록 없음"으로 표시된 날은 부모가 기록을 남기지 않은 것뿐이니, 수면이 없었다고 판단하지 말고 조언에서 제외해줘.

                %s

                이 수면 패턴을 보고 부모에게 도움이 되는 조언을 3~4문장으로 짧게 해줘.
                의학적 진단이나 확정적인 판단은 하지 말고, 일반적인 수면 패턴 관점에서만 조언해줘.
                """.formatted(ageInMonths, summary.toString());

        return ollamaClient.chat(prompt);

    }

    private void validateSleepTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null) {
            throw new IllegalArgumentException("시작 시간은 필수 입력 항목입니다.");
        }
        if (endTime != null && endTime.isBefore(startTime)) {
            throw new IllegalArgumentException("종료 시간은 시작 시간보다 빠를 수 없습니다.");
        }
    }

}