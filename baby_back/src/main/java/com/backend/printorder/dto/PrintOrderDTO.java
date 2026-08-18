package com.backend.printorder.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class PrintOrderDTO {

    private Long orderNo;

    private Long babyNo;

    private String orderId;

    private String status;

    private Integer totalAmount;

    private String receiverName;

    private String receiverPhone;

    private String zipcode;

    private String address;

    private String addressDetail;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    private List<PrintOrderItemDTO> items;

}