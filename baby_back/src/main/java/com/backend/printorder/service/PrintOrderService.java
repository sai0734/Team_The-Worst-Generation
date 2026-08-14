package com.backend.printorder.service;

import com.backend.printorder.dto.PrintOrderCreateRequestDTO;
import com.backend.printorder.dto.PrintOrderDTO;

import java.util.List;

public interface PrintOrderService {

    PrintOrderDTO register(PrintOrderCreateRequestDTO requestDTO, String email);

    PrintOrderDTO confirmPayment(String orderId, String paymentKey, Integer amount, String email);

    List<PrintOrderDTO> getList(String email);

    PrintOrderDTO getDetail(String orderId, String email);

}
