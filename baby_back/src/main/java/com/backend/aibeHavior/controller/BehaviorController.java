package com.backend.aibeHavior.controller;

import com.backend.aibeHavior.dto.BehaviorConsultRequest;
import com.backend.aibeHavior.dto.BehaviorConsultResponse;
import com.backend.aibeHavior.dto.BehaviorMessageRequest;
import com.backend.aibeHavior.service.BehaviorService;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/baby-behavior")
@Log4j2
public class BehaviorController {

    private final BehaviorService behaviorService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public BehaviorConsultResponse createConsult(@RequestBody BehaviorConsultRequest request, Principal principal) {

        log.info("behavior_Controller_createConsult_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return behaviorService.createConsult(request, email);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/message")
    public BehaviorConsultResponse addMessage(@RequestBody BehaviorMessageRequest request, Principal principal) {

        log.info("behavior_Controller_addMessage_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return behaviorService.addMessage(request, email);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/list")
    public PageResponseDTO<BehaviorConsultResponse> list(@RequestParam("babyNo") Long babyNo,
                                                         PageRequestDTO pageRequestDTO,
                                                         Principal principal) {

        log.info("behavior_Controller_list_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return behaviorService.getList(babyNo, email, pageRequestDTO);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{consultNo}")
    public BehaviorConsultResponse getDetail(@PathVariable("consultNo") Long consultNo, Principal principal) {

        log.info("behavior_Controller_getDetail_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return behaviorService.getDetail(consultNo, email);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{consultNo}")
    public void removeConsult(@PathVariable("consultNo") Long consultNo, Principal principal) {

        log.info("behavior_Controller_removeConsult_실행~~~~~~~~~~~~");

        String email = principal.getName();

        behaviorService.removeConsult(consultNo, email);

    }

}