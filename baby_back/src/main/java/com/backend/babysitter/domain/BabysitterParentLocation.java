package com.backend.babysitter.domain;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterParentLocation {

    private String email;

    private String region;

    public void changeRegion(String region) {
        this.region = region;
    }
}
