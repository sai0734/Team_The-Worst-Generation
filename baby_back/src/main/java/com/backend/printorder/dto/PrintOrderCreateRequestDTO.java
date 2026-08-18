package com.backend.printorder.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PrintOrderCreateRequestDTO {

    private Long babyNo;

    private String receiverName;

    private String receiverPhone;

    private String zipcode;

    private String address;

    private String addressDetail;

    private List<PrintOrderItemRequestDTO> items;

}