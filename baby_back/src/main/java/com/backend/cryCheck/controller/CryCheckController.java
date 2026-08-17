package com.backend.cryCheck.controller;

import com.backend.cryCheck.dto.CryCheckDTO;
import com.backend.cryCheck.service.CryCheckService;
import com.backend.global.util.CustomFileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cry-check")
@Log4j2
public class CryCheckController {

    private final CryCheckService cryCheckService;

    private final CustomFileUtil fileUtil;

    // 녹음/업로드한 오디오 파일 + 프론트(Web Audio API)에서 뽑은 음향 특징을 같이 받음.
    // 영상으로 올려도 프론트에서 오디오 트랙만 추출해서 여기엔 오디오 파일만 옴.
    // 파일 저장은 서비스에서 "진짜 울음소리로 판단됐을 때만" 하도록 넘겨줌 (아니면 고아 파일만 쌓임)
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public CryCheckDTO analyze(CryCheckDTO cryCheckDTO, Principal principal) {

        log.info("cryCheck_Controller_analyze_실행~~~~~~~~~~~");

        String email = principal.getName();

        return cryCheckService.analyze(cryCheckDTO, email);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{cryCheckNo}")
    public CryCheckDTO get(@PathVariable Long cryCheckNo, Principal principal) {

        log.info("cryCheck_Controller_get_실행~~~~~~~~~~~");

        String email = principal.getName();

        return cryCheckService.get(cryCheckNo, email);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/list/{babyNo}")
    public List<CryCheckDTO> getList(@PathVariable Long babyNo, Principal principal) {

        log.info("cryCheck_Controller_getList_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return cryCheckService.getList(babyNo, email);
    }

    // 다시듣기용 오디오 파일 재생. <audio src="..."> 태그는 Authorization 헤더를 못 실어서
    // (SecurityPaths.PUBLIC_URLS에도 등록되어 있음) 인증 없이 열어둠 - 매물 이미지 엔드포인트와 동일한 방식
    @GetMapping("/files/{fileName}")
    public ResponseEntity<Resource> viewFile(@PathVariable String fileName) {
        return fileUtil.getFile(fileName);
    }

    // 피드백 칩("실제로 이거였어요") 응답 저장
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{cryCheckNo}/feedback")
    public Map<String, String> submitFeedback(
            @PathVariable Long cryCheckNo,
            @RequestParam String feedback,
            Principal principal
    ) {

        log.info("cryCheck_Controller_submitFeedback_실행~~~~~~~~~~~~");

        String email = principal.getName();

        cryCheckService.submitFeedback(cryCheckNo, feedback, email);

        return Map.of("result", "success");
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{cryCheckNo}")
    public Map<String, String> remove(@PathVariable Long cryCheckNo, Principal principal) {

        log.info("cryCheck_Controller_remove_실행~~~~~~~~~~~~");

        String email = principal.getName();

        String audioFileName = cryCheckService.remove(cryCheckNo, email);

        // DB 기록 삭제는 이미 끝난 뒤라, 파일 삭제가 실패(윈도우 파일 잠김 등)해도
        // 응답 자체는 성공으로 내려줘야 함 - 안 그러면 DB는 지워졌는데 프론트는 실패로 오해함
        if (audioFileName != null) {
            try {
                fileUtil.deleteFiles(List.of(audioFileName));
            } catch (Exception e) {
                log.error("cry-check 오디오 파일 삭제 실패 (DB 기록은 정상 삭제됨): " + e.getMessage());
            }
        }

        return Map.of("result", "success");
    }
}
