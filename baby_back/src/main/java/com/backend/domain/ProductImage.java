package com.backend.domain;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductImage {

    private String fileName; 

    private int ord;

    public void setOrd(int ord){
        this.ord = ord;
    }

}