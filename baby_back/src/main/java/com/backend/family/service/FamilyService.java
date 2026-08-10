package com.backend.family.service;

import java.util.List;

import com.backend.family.dto.FamilyCreateDTO;
import com.backend.family.dto.FamilyDTO;
import com.backend.family.dto.FamilyJoinDTO;
import com.backend.family.dto.FamilyMemberDTO;


public interface FamilyService {

    FamilyDTO createFamily(String memberEmail, FamilyCreateDTO familyCreateDTO);

    FamilyDTO getMyFamily(String memberEmail);

    List<FamilyMemberDTO> getMyFamilyMembers(String memberEmail);

    FamilyDTO joinFamily(String memberEmail, FamilyJoinDTO familyJoinDTO);

    void leaveFamily(String memberEmail);
}