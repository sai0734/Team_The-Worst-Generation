package com.backend.printorder.service;

import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.printorder.dto.PrintOrderCreateRequestDTO;
import com.backend.printorder.dto.PrintOrderDTO;

public interface PrintOrderService {

    PrintOrderDTO register(PrintOrderCreateRequestDTO requestDTO, String email);

    PrintOrderDTO confirmPayment(String orderId, String paymentKey, Integer amount, String email);

    PageResponseDTO<PrintOrderDTO> getList(String email, PageRequestDTO pageRequestDTO);

    PrintOrderDTO getDetail(String orderId, String email);

}
