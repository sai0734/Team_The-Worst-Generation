package com.backend.auth.profile.service;

import com.backend.auth.profile.dto.MemberProfileDTO;

import java.util.List;

public interface MemberProfileService {

    Long register(String memberEmail, MemberProfileDTO memberProfileDTO);

    List<MemberProfileDTO> listMine(String memberEmail);

    void modify(String memberEmail, Long profileId, MemberProfileDTO memberProfileDTO);

    void remove(String memberEmail, Long profileId);

    MemberProfileDTO selectProfile(String memberEmail, Long profileId);
}
