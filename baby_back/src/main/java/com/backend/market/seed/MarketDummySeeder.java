package com.backend.market.seed;

import com.backend.auth.mapper.MemberMapper;
import com.backend.market.domain.MarketProfile;
import com.backend.market.dto.MarketItemDTO;
import com.backend.market.mapper.MarketItemMapper;
import com.backend.market.mapper.MarketProfileMapper;
import com.backend.market.service.MarketItemService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

// LJW - 감자마켓 더미데이터 자동 시딩
// tbl_market_item이 비어있을 때 백엔드가 뜨면서 한 번만 실행됨 (로컬 bootRun이든 docker든 동일하게 동작).
// 이미지 원본은 resources/seed/marketSeed 에 번들되어 있어서 외부 파일 경로나 로그인 스크립트 실행이 필요 없음.
//
// 판매자는 새 계정을 만들지 않고, MemberMapperTests.testInsertMember()로 미리 만들어둔
// user1@aaa.com ~ user8@aaa.com 테스트 계정에 라운드로빈으로 나눠 배분함 (tbl_member는 읽기만 함).
// 그 계정들이 아직 안 만들어져 있으면(=해당 테스트 실행 전) 존재하는 계정만 골라서 씀.
// 하나도 없으면 이번 기동에서는 건너뛰고, tbl_market_item이 계속 비어있으니 다음 기동 때 다시 시도함.
//
// 홈 화면 카카오맵은 로그인한 사용자의 MarketProfile(내 동네) 좌표를 지도 중심으로 우선 사용하기 때문에
// (없으면 GPS, 그것도 없으면 서울시청 기본값 - 래미안서초스위트에서 8km 이상 떨어져 있어 5km 반경 밖으로 벗어남),
// 매물이 항상 지도에 잡히도록 판매자로 쓰는 계정들의 MarketProfile 좌표도 같이 래미안서초스위트로 맞춰준다.
@Component
@RequiredArgsConstructor
@Log4j2
public class MarketDummySeeder implements ApplicationRunner {

    private static final List<String> SEED_SELLER_EMAILS = List.of(
            "user1@aaa.com", "user2@aaa.com", "user3@aaa.com", "user4@aaa.com",
            "user5@aaa.com", "user6@aaa.com", "user7@aaa.com", "user8@aaa.com"
    );
    private static final String SEED_LOCATION_NAME = "서울 서초구 서운로 일대";
    private static final String SEED_TRACKER_FILE = ".market-seed-files.json"; // 저번 시딩 때 만든 파일 목록 추적용

    // 래미안서초스위트 (서울 서초구 서운로 221) 기준
    private static final double CENTER_LAT = 37.5021291;
    private static final double CENTER_LNG = 127.0204507;
    private static final double RADIUS_KM = 4.5; // 5km 필터 경계 안쪽으로 여유

    private final MarketItemMapper marketItemMapper;
    private final MarketItemService marketItemService;
    private final MarketProfileMapper marketProfileMapper;
    private final MemberMapper memberMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${com.backend.upload.path}")
    private String uploadPath;

    @Override
    public void run(ApplicationArguments args) throws Exception {

        if (marketItemMapper.countAll() > 0) {
            return;
        }

        List<String> availableSellers = SEED_SELLER_EMAILS.stream()
                .filter(email -> memberMapper.selectByEmail(email) != null)
                .collect(Collectors.toList());

        if (availableSellers.isEmpty()) {
            log.info("user1~8@aaa.com 계정이 하나도 없음 (MemberMapperTests.testInsertMember 먼저 실행 필요) - 감자마켓 더미데이터 시딩 건너뜀");
            return;
        }

        ClassPathResource manifestResource = new ClassPathResource("seed/marketSeed/manifest.json");
        if (!manifestResource.exists()) {
            log.info("seed/marketSeed/manifest.json 없음 - 감자마켓 더미데이터 시딩 건너뜀");
            return;
        }

        List<SeedItem> items;
        try (InputStream in = manifestResource.getInputStream()) {
            items = objectMapper.readValue(
                    in,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, SeedItem.class)
            );
        }

        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        // DB가 비어서 다시 시딩한다는 건 예전 시딩 결과물(이미지)은 이미 주인 잃은 상태라는 뜻 -
        // 실제 사용자 업로드 파일은 이 추적 목록에 없으니 안전하게 예전 시드 이미지만 지움
        cleanupPreviousSeedFiles();

        // 판매자로 쓰는 계정들의 "내 동네"를 래미안서초스위트로 맞춰서, 이 계정으로 로그인하면
        // 홈 지도가 처음부터 매물이 다 잡히는 위치를 중심으로 뜨게 함
        availableSellers.forEach(this::alignProfileToSeedCenter);

        List<String> allSavedFileNames = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            String sellerEmail = availableSellers.get(i % availableSellers.size());
            allSavedFileNames.addAll(registerSeedItem(items.get(i), sellerEmail));
        }

        writeSeedTracker(allSavedFileNames);

        log.info("감자마켓 더미데이터 {}건 시딩 완료 (판매자 {}명: {})",
                items.size(), availableSellers.size(), availableSellers);
    }

    // 저번 시딩 때 추적 목록에 남겨둔 파일들을 정리 (원본 + 썸네일). 목록에 없는 파일(실사용자 업로드)은 절대 안 건드림
    private void cleanupPreviousSeedFiles() {

        File trackerFile = Paths.get(uploadPath, SEED_TRACKER_FILE).toFile();
        if (!trackerFile.exists()) {
            return;
        }

        try {
            List<String> previousFiles = objectMapper.readValue(
                    trackerFile,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
            for (String fileName : previousFiles) {
                Files.deleteIfExists(Paths.get(uploadPath, fileName));
                Files.deleteIfExists(Paths.get(uploadPath, "s_" + fileName));
            }
            log.info("이전 감자마켓 시드 이미지 {}개 정리 완료", previousFiles.size());
        } catch (Exception e) {
            log.warn("이전 시드 이미지 정리 중 오류 (무시하고 계속 진행)", e);
        } finally {
            trackerFile.delete();
        }
    }

    // 이번에 새로 만든 파일 목록을 남겨서, 다음 재시딩 때 정확히 이 파일들만 지울 수 있게 함
    private void writeSeedTracker(List<String> fileNames) throws Exception {
        objectMapper.writeValue(Paths.get(uploadPath, SEED_TRACKER_FILE).toFile(), fileNames);
    }

    // MarketProfileServiceImpl.get()과 동일한 upsert 패턴 (없으면 insert, 있으면 update)
    private void alignProfileToSeedCenter(String email) {

        MarketProfile profile = marketProfileMapper.selectByEmail(email);

        if (profile == null) {
            profile = MarketProfile.builder().email(email).build();
            profile.changeLocation(SEED_LOCATION_NAME, BigDecimal.valueOf(CENTER_LAT), BigDecimal.valueOf(CENTER_LNG));
            profile.verifyLocation();
            marketProfileMapper.insert(profile);
        } else {
            profile.changeLocation(SEED_LOCATION_NAME, BigDecimal.valueOf(CENTER_LAT), BigDecimal.valueOf(CENTER_LNG));
            profile.verifyLocation();
            marketProfileMapper.update(profile);
        }
    }

    private List<String> registerSeedItem(SeedItem item, String sellerEmail) throws Exception {

        List<String> savedNames = new ArrayList<>();
        savedNames.add(saveSeedImage(item.dir, item.mainImage));
        for (String other : item.otherImages) {
            savedNames.add(saveSeedImage(item.dir, other));
        }

        double[] point = randomPointInRadius(CENTER_LAT, CENTER_LNG, RADIUS_KM);

        MarketItemDTO dto = MarketItemDTO.builder()
                .sellerEmail(sellerEmail)
                .title(item.title)
                .price(item.price)
                .description(item.description)
                .tradeType("SALE")
                .category(item.category)
                .allowOffer(false)
                .locationName(SEED_LOCATION_NAME)
                .latitude(BigDecimal.valueOf(point[0]))
                .longitude(BigDecimal.valueOf(point[1]))
                .uploadFileNames(savedNames)
                .build();

        Long itemNo = marketItemService.register(dto);

        // 등록 시점이 다 똑같으면 "N일 전" 표시가 밋밋해서, 최근 2주 안에서 랜덤하게 흩어놓음
        LocalDateTime randomRegTime = LocalDateTime.now().minusMinutes((long) (Math.random() * 14 * 24 * 60));
        marketItemMapper.updateRegTime(itemNo, randomRegTime);

        return savedNames;
    }

    // CustomFileUtil.saveFiles와 동일한 규칙(UUID 접두어 + 200x200 썸네일)으로 저장.
    // classpath 리소스라 MultipartFile이 아니어서 여기서 직접 복사함.
    private String saveSeedImage(String dir, String fileName) throws Exception {

        ClassPathResource resource = new ClassPathResource("seed/marketSeed/" + dir + "/" + fileName);
        String savedName = UUID.randomUUID() + "_" + fileName;
        Path savePath = Paths.get(uploadPath, savedName);

        try (InputStream in = resource.getInputStream()) {
            Files.copy(in, savePath);
        }

        Path thumbnailPath = Paths.get(uploadPath, "s_" + savedName);
        Thumbnails.of(savePath.toFile()).size(200, 200).toFile(thumbnailPath.toFile());

        return savedName;
    }

    private double[] randomPointInRadius(double centerLat, double centerLng, double radiusKm) {
        double r = radiusKm * Math.sqrt(Math.random());
        double theta = Math.random() * 2 * Math.PI;
        double dLat = (r / 111.0) * Math.cos(theta);
        double dLng = (r / (111.0 * Math.cos(Math.toRadians(centerLat)))) * Math.sin(theta);
        return new double[]{centerLat + dLat, centerLng + dLng};
    }

    // manifest.json 항목 하나와 대응 (organizeSeed로 생성된 파일)
    public static class SeedItem {
        public String dir;
        public String category;
        public String title;
        public int price;
        public String description;
        public String mainImage;
        public List<String> otherImages;
    }
}
