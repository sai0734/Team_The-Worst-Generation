package com.backend.sleep.controller;

import com.backend.sleep.dto.BabySleepDTO;
import com.backend.sleep.service.BabySleepService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/baby-sleep")
@Log4j2
public class BabySleepController {

    private final BabySleepService babySleepService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{babyNo}")
    public List<BabySleepDTO> list(@PathVariable(name = "babyNo") Long babyNo, Principal principal) {

        log.info("babySleep_Controller_list_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return babySleepService.getList(babyNo, email);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> register(@RequestBody BabySleepDTO babySleepDTO, Principal principal) {

        log.info("babySleep_Controller_register_실행~~~~~~~~~~~~");

        String email = principal.getName();

        Long sleepNo = babySleepService.register(babySleepDTO, email);

        return Map.of("sleepNo", sleepNo);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{sleepNo}")
    public void modify(@PathVariable(name = "sleepNo") Long sleepNo,
                       @RequestBody BabySleepDTO babySleepDTO, Principal principal) {

        log.info("babySleep_Controller_modify_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babySleepDTO.setSleepNo(sleepNo);

        babySleepService.modify(babySleepDTO, email);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{sleepNo}")
    public void remove(@PathVariable(name = "sleepNo") Long sleepNo, Principal principal) {

        log.info("babySleep_Controller_remove_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babySleepService.remove(sleepNo, email);

    }

}