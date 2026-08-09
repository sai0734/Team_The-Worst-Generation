package com.backend.vaccination.controller;

import com.backend.vaccination.dto.BabyVaccinationDTO;
import com.backend.vaccination.dto.VaccinationProgressDTO;
import com.backend.vaccination.service.BabyVaccinationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/baby-vaccination")
@Log4j2
public class BabyVaccinationController {

    private final BabyVaccinationService babyVaccinationService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{babyNo}")
    public List<BabyVaccinationDTO> list(@PathVariable(name = "babyNo") Long babyNo, Principal principal) {

        log.info("babyVaccination_Controller_list_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return babyVaccinationService.getList(babyNo, email);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/{babyNo}/init")
    public void init(@PathVariable(name = "babyNo") Long babyNo, Principal principal) {

        log.info("babyVaccination_Controller_init_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babyVaccinationService.initSchedule(babyNo, email);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{vaccinationNo}")
    public void completeCheck(@PathVariable(name = "vaccinationNo") Long vaccinationNo,
                              @RequestBody BabyVaccinationDTO babyVaccinationDTO, Principal principal) {

        log.info("babyVaccination_Controller_completeCheck_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babyVaccinationDTO.setVaccinationNo(vaccinationNo);

        babyVaccinationService.completeCheck(babyVaccinationDTO, email);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> registerCustom(@RequestBody BabyVaccinationDTO babyVaccinationDTO, Principal principal) {

        log.info("babyVaccination_Controller_registerCustom_실행~~~~~~~~~~~~");

        String email = principal.getName();

        Long vaccinationNo = babyVaccinationService.registerCustom(babyVaccinationDTO, email);

        return Map.of("vaccinationNo", vaccinationNo);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{vaccinationNo}")
    public void remove(@PathVariable(name = "vaccinationNo") Long vaccinationNo, Principal principal) {

        log.info("babyVaccination_Controller_remove_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babyVaccinationService.remove(vaccinationNo, email);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{babyNo}/progress")
    public VaccinationProgressDTO progress(@PathVariable(name = "babyNo") Long babyNo, Principal principal) {

        log.info("babyVaccination_Controller_progress_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return babyVaccinationService.getProgress(babyNo, email);

    }

}