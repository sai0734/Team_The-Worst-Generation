package com.backend.printorder.service;

import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.printorder.domain.PrintOrder;
import com.backend.printorder.domain.PrintOrderItem;
import com.backend.printorder.dto.PrintOrderCreateRequestDTO;
import com.backend.printorder.dto.PrintOrderDTO;
import com.backend.printorder.dto.PrintOrderItemDTO;
import com.backend.printorder.dto.PrintOrderItemRequestDTO;
import com.backend.printorder.mapper.PrintOrderMapper;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.album.mapper.BabyAlbumMapper;
import com.backend.printorder.client.TossPaymentClient;
import com.backend.printorder.dto.TossPaymentResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
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

    private final BabyInfoMapper babyInfoMapper;

    private final BabyAlbumMapper babyAlbumMapper;

    private final TossPaymentClient tossPaymentClient;

    private final ModelMapper modelMapper;

    private static final int UNIT_PRICE = 5000;
    @Override
    public PrintOrderDTO register(PrintOrderCreateRequestDTO requestDTO, String email) {

        log.info("printOrder_Service_register_실행~~~~~~~~~~~~");

        if(requestDTO.getItems() == null || requestDTO.getItems().isEmpty()) {
            throw new IllegalArgumentException("인화할 사진을 선택해주세요.");
        }

        if (babyInfoMapper.selectByBabyNo(requestDTO.getBabyNo(), email) == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + requestDTO.getBabyNo());
        }

        for (PrintOrderItemRequestDTO itemReq : requestDTO.getItems()) {
            if (babyAlbumMapper.countByAlbumNoAndBabyNo(itemReq.getAlbumNo(), requestDTO.getBabyNo()) == 0) {
                throw new IllegalArgumentException("존재하지 않는 사진입니다: " + itemReq.getAlbumNo());
            }
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

        if ("PAID".equals(printOrder.getStatus())) {
            return modelMapper.map(printOrder, PrintOrderDTO.class);
        }

        TossPaymentResponseDTO tossPaymentResponseDTO = tossPaymentClient.confirm(paymentKey, orderId, amount);

        if (!"DONE".equals(tossPaymentResponseDTO.getStatus())) {
            throw new IllegalArgumentException("결제가 완료되지 않았습니다. (status: " + tossPaymentResponseDTO.getStatus() + ")");
        }

        printOrderMapper.updateStatus(orderId, "PAID", paymentKey);

        PrintOrder updated = printOrderMapper.selectByOrderId(orderId);
        return modelMapper.map(updated, PrintOrderDTO.class);

    }

    @Override
    public PageResponseDTO<PrintOrderDTO> getList(String email, PageRequestDTO pageRequestDTO) {

        log.info("printOrder_Service_getList_실행~~~~~~~~~~~~");

        int skip = (pageRequestDTO.getPage() - 1) * pageRequestDTO.getSize();

        List<PrintOrder> orders = printOrderMapper.selectListByEmail(email, skip, pageRequestDTO.getSize());

        List<PrintOrderDTO> printOrderDTOList = orders.stream()
                .map(order -> modelMapper.map(order, PrintOrderDTO.class))
                .collect(Collectors.toList());

        long totalCount = printOrderMapper.selectListCountByEmail(email);

        return PageResponseDTO.<PrintOrderDTO>withAll()
                .dtoList(printOrderDTOList)
                .totalCount(totalCount)
                .pageRequestDTO(pageRequestDTO)
                .build();

    }

    @Override
    public PrintOrderDTO getDetail(String orderId, String email) {

        log.info("printOrder_Service_getDetail_실행~~~~~~~~~~~~");

        PrintOrder printOrder = printOrderMapper.selectByOrderId(orderId);

        if (printOrder == null || !printOrder.getEmail().equals(email)) {
            throw new IllegalArgumentException("존재하지 않는 주문입니다: " + orderId);
        }

        List<PrintOrderItemDTO> itemDTOs = printOrderMapper.selectItemsByOrderNo(printOrder.getOrderNo());

        PrintOrderDTO printOrderDTO = modelMapper.map(printOrder, PrintOrderDTO.class);
        printOrderDTO.setItems(itemDTOs);

        return printOrderDTO;

    }
}
