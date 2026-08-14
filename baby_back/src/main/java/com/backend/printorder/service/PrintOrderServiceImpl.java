package com.backend.printorder.service;

import com.backend.printorder.domain.PrintOrder;
import com.backend.printorder.domain.PrintOrderItem;
import com.backend.printorder.dto.PrintOrderCreateRequestDTO;
import com.backend.printorder.dto.PrintOrderDTO;
import com.backend.printorder.dto.PrintOrderItemDTO;
import com.backend.printorder.dto.PrintOrderItemRequestDTO;
import com.backend.printorder.mapper.PrintOrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class PrintOrderServiceImpl implements PrintOrderService{

    private final PrintOrderMapper printOrderMapper;

    private final ModelMapper modelMapper;

    private static final int UNIT_PRICE = 500;
    @Override
    public PrintOrderDTO register(PrintOrderCreateRequestDTO requestDTO, String email) {

        log.info("printOrder_Service_register_실행~~~~~~~~~~~~");

        if(requestDTO.getItems() == null || requestDTO.getItems().isEmpty()) {
            throw new IllegalArgumentException("인화할 사진을 선택해주세요.");
        }

        int totalAmount = requestDTO.getItems().stream()
                .mapToInt(item -> item.getQuantity() * UNIT_PRICE).sum();

        PrintOrder printOrder = PrintOrder.builder()
                .email(email)
                .babyNo(requestDTO.getBabyNo())
                .orderId(UUID.randomUUID().toString())
                .status("PENDING")
                .totalAmount(totalAmount)
                .receiverName(requestDTO.getReceiverName())
                .receiverPhone(requestDTO.getReceiverPhone())
                .zipcode(requestDTO.getZipcode())
                .address(requestDTO.getAddress())
                .addressDetail(requestDTO.getAddressDetail())
                .build();
        
        printOrderMapper.insertOrder(printOrder);

        for (PrintOrderItemRequestDTO itemReq : requestDTO.getItems()) {
            PrintOrderItem item = PrintOrderItem.builder()
                    .orderNo(printOrder.getOrderNo())
                    .albumNo(itemReq.getAlbumNo())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(UNIT_PRICE)
                    .build();
            printOrderMapper.insertOrderItem(item);
        }

        PrintOrderDTO printOrderDTO = modelMapper.map(printOrder, PrintOrderDTO.class);

        return printOrderDTO;

    }

    @Override
    public PrintOrderDTO confirmPayment(String orderId, String paymentKey, Integer amount, String email) {

        log.info("printOrder_Service_confirmPayment_실행~~~~~~~~~~~~");

        PrintOrder printOrder = printOrderMapper.selectByOrderId(orderId);

        if (printOrder == null) {
            throw new IllegalArgumentException("존재하지 않는 주문입니다: " + orderId);
        }
        if (!printOrder.getEmail().equals(email)) {
            throw new IllegalArgumentException("본인의 주문만 결제할 수 있습니다.");
        }
        if (!printOrder.getTotalAmount().equals(amount)) {
            throw new IllegalArgumentException("결제 금액이 주문 금액과 일치하지 않습니다.");
        }

        // TODO: 다음 단계에서 여기에 토스페이먼츠 결제승인 API 호출을 추가할 예정
        // (지금은 우리 쪽 금액 검증까지만 하고 바로 PAID로 처리 중 - 아직 미완성)

        printOrderMapper.updateStatus(orderId, "PAID", paymentKey);

        PrintOrder updated = printOrderMapper.selectByOrderId(orderId);
        return modelMapper.map(updated, PrintOrderDTO.class);

    }

    @Override
    public List<PrintOrderDTO> getList(String email) {

        log.info("printOrder_Service_getList_실행~~~~~~~~~~~~");

        List<PrintOrder> orders = printOrderMapper.selectListByEmail(email);

        return orders.stream()
                .map(order -> modelMapper.map(order, PrintOrderDTO.class))
                .collect(Collectors.toList());

    }

    @Override
    public PrintOrderDTO getDetail(String orderId, String email) {

        log.info("printOrder_Service_getDetail_실행~~~~~~~~~~~~");

        PrintOrder printOrder = printOrderMapper.selectByOrderId(orderId);

        if (printOrder == null || !printOrder.getEmail().equals(email)) {
            throw new IllegalArgumentException("존재하지 않는 주문입니다: " + orderId);
        }

        List<PrintOrderItem> items = printOrderMapper.selectItemsByOrderNo(printOrder.getOrderNo());
        List<PrintOrderItemDTO> itemDTOs = items.stream()
                .map(item -> modelMapper.map(item, PrintOrderItemDTO.class))
                .collect(Collectors.toList());

        PrintOrderDTO printOrderDTO = modelMapper.map(printOrder, PrintOrderDTO.class);
        printOrderDTO.setItems(itemDTOs);

        return printOrderDTO;

    }
}
