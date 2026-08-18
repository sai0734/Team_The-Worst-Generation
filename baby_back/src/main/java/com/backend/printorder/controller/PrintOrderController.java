package com.backend.printorder.controller;

import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.printorder.dto.PrintOrderConfirmRequestDTO;
import com.backend.printorder.dto.PrintOrderCreateRequestDTO;
import com.backend.printorder.dto.PrintOrderDTO;
import com.backend.printorder.service.PrintOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/print-order")
@Log4j2
public class PrintOrderController {

    private final PrintOrderService printOrderService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public PrintOrderDTO register(@RequestBody PrintOrderCreateRequestDTO requestDTO, Principal principal) {

        log.info("printOrder_Controller_register_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return printOrderService.register(requestDTO, email);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/confirm")
    public PrintOrderDTO confirm(@RequestBody PrintOrderConfirmRequestDTO requestDTO, Principal principal) {

        log.info("printOrder_Controller_confirm_실행~~~~~~~~~~~~");

        String email = principal.getName();

        PrintOrderDTO printOrderDTO = printOrderService.confirmPayment(
                requestDTO.getOrderId(), requestDTO.getPaymentKey(), requestDTO.getAmount(), email);

        return printOrderDTO;

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/list")
    public PageResponseDTO<PrintOrderDTO> list(PageRequestDTO pageRequestDTO, Principal principal) {

        log.info("printOrder_Controller_list_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return printOrderService.getList(email, pageRequestDTO);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{orderId}")
    public PrintOrderDTO detail(@PathVariable("orderId") String orderId, Principal principal) {

        log.info("printOrder_Controller_detail_실행~~~~~~~~~~~~");

        String email = principal.getName();

        PrintOrderDTO printOrderDTO = printOrderService.getDetail(orderId, email);

        return printOrderDTO;

    }

}