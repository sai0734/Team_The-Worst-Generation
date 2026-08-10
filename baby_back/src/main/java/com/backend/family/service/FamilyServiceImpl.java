package com.backend.family.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.backend.family.utils.FamilyInviteCode;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import com.backend.family.domain.Family;
import com.backend.family.domain.FamilyMember;
import com.backend.family.domain.FamilyRole;
import com.backend.family.dto.FamilyCreateDTO;
import com.backend.family.dto.FamilyDTO;
import com.backend.family.dto.FamilyJoinDTO;
import com.backend.family.dto.FamilyMemberDTO;
import com.backend.family.exception.FamilyErrorCode;
import com.backend.family.exception.FamilyException;
import com.backend.family.mapper.FamilyMapper;
import com.backend.family.projection.FamilyMemberProjection;


import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FamilyServiceImpl implements FamilyService {

    private static final int INVITE_CODE_CREATE_MAX_RETRY = 5;

    private final FamilyMapper familyMapper;

    // 로그인한 사용자가 새 가족을 생성한다.
    // 생성자는 가족의 OWNER로 등록되고, 이미 가족에 속한 회원은 생성할 수 없다.
    @Override
    public FamilyDTO createFamily(String memberEmail, FamilyCreateDTO familyCreateDTO) {

        validateFamilyCreateRequest(familyCreateDTO);
        validateNotJoinedFamily(memberEmail);

        Family family = insertFamilyWithUniqueInviteCode(memberEmail, familyCreateDTO.getFamilyName());

        familyMapper.insertFamilyMember(FamilyMember.builder()
                .familyId(family.getFamilyId())
                .memberEmail(memberEmail)
                .familyRole(FamilyRole.OWNER)
                .parentType(familyCreateDTO.getParentType())
                .build());

        return entityToDTO(family);
    }

    // 로그인한 사용자가 현재 속한 가족 정보를 조회한다.
    @Override
    public FamilyDTO getMyFamily(String memberEmail) {

        Family family = getFamilyByMemberEmail(memberEmail);

        return entityToDTO(family);
    }

    // 로그인한 사용자가 속한 가족의 구성원 목록을 조회한다.
    // 구성원 이메일, 닉네임, 가족 권한, 부모 타입을 함께 반환한다.
    @Override
    public List<FamilyMemberDTO> getMyFamilyMembers(String memberEmail) {

        Family family = getFamilyByMemberEmail(memberEmail);

        return familyMapper.selectFamilyMembers(family.getFamilyId())
                .stream()
                .map(this::projectionToDTO)
                .collect(Collectors.toList());
    }

    // 로그인한 사용자가 초대 코드를 이용해 기존 가족에 참여한다.
    // 참여자는 MEMBER 권한으로 등록되고, 이미 가족에 속한 회원은 참여할 수 없다.
    @Override
    public FamilyDTO joinFamily(String memberEmail, FamilyJoinDTO familyJoinDTO) {

        validateFamilyJoinRequest(familyJoinDTO);
        validateNotJoinedFamily(memberEmail);

        Family family = Optional.ofNullable(familyMapper.selectFamilyByInviteCode(familyJoinDTO.getInviteCode()))
                .orElseThrow(() -> new FamilyException(FamilyErrorCode.FAMILY_NOT_FOUND));

        familyMapper.insertFamilyMember(FamilyMember.builder()
                .familyId(family.getFamilyId())
                .memberEmail(memberEmail)
                .familyRole(FamilyRole.MEMBER)
                .parentType(familyJoinDTO.getParentType())
                .build());

        return entityToDTO(family);
    }

    // 로그인한 사용자가 가족에서 나간다.
    // OWNER는 가족 관리자가 사라지는 것을 막기 위해 바로 나갈 수 없다.
    @Override
    public void leaveFamily(String memberEmail) {

        FamilyMember familyMember = Optional.ofNullable(familyMapper.selectFamilyMemberByEmail(memberEmail))
                .orElseThrow(() -> new FamilyException(FamilyErrorCode.FAMILY_NOT_FOUND));

        if (FamilyRole.OWNER.equals(familyMember.getFamilyRole())) {
            throw new FamilyException(FamilyErrorCode.OWNER_CANNOT_LEAVE);
        }

        familyMapper.deleteFamilyMember(memberEmail);
    }

    // 회원 이메일을 기준으로 사용자가 속한 가족을 조회한다.
    private Family getFamilyByMemberEmail(String memberEmail) {

        return Optional.ofNullable(familyMapper.selectFamilyByMemberEmail(memberEmail))
                .orElseThrow(() -> new FamilyException(FamilyErrorCode.FAMILY_NOT_FOUND));
    }

    // 사용자가 이미 가족에 속해 있는지 확인한다.
    private void validateNotJoinedFamily(String memberEmail) {

        if (familyMapper.selectFamilyMemberByEmail(memberEmail) != null) {
            throw new FamilyException(FamilyErrorCode.ALREADY_JOINED_FAMILY);
        }
    }

    // 가족 생성 요청에 필요한 값이 있는지 확인한다.
    private void validateFamilyCreateRequest(FamilyCreateDTO familyCreateDTO) {

        if (familyCreateDTO == null
                || familyCreateDTO.getFamilyName() == null
                || familyCreateDTO.getFamilyName().isBlank()
                || familyCreateDTO.getParentType() == null) {
            throw new FamilyException(FamilyErrorCode.INVALID_FAMILY_CREATE_REQUEST);
        }
    }

    // 가족 참여 요청에 필요한 값이 있는지 확인한다.
    private void validateFamilyJoinRequest(FamilyJoinDTO familyJoinDTO) {

        if (familyJoinDTO == null
                || familyJoinDTO.getInviteCode() == null
                || familyJoinDTO.getInviteCode().isBlank()
                || familyJoinDTO.getParentType() == null) {
            throw new FamilyException(FamilyErrorCode.INVALID_FAMILY_JOIN_REQUEST);
        }
    }

    // 초대 코드 중복이 발생하면 새 코드를 생성해 가족 생성을 다시 시도한다.
    private Family insertFamilyWithUniqueInviteCode(String memberEmail, String familyName) {

        for (int retryCount = 0; retryCount < INVITE_CODE_CREATE_MAX_RETRY; retryCount++) {
            Family family = Family.builder()
                    .familyName(familyName)
                    .inviteCode(FamilyInviteCode.generateInviteCode())
                    .createdBy(memberEmail)
                    .build();

            try {
                familyMapper.insertFamily(family);
                return family;
            } catch (DuplicateKeyException e) {
                if (retryCount == INVITE_CODE_CREATE_MAX_RETRY - 1) {
                    throw new FamilyException(FamilyErrorCode.INVITE_CODE_CREATE_FAILED);
                }
            }
        }

        throw new FamilyException(FamilyErrorCode.INVITE_CODE_CREATE_FAILED);
    }

    // Family 도메인을 응답용 DTO로 변환한다.
    private FamilyDTO entityToDTO(Family family) {

        return FamilyDTO.builder()
                .familyId(family.getFamilyId())
                .familyName(family.getFamilyName())
                .inviteCode(family.getInviteCode())
                .createdBy(family.getCreatedBy())
                .createdAt(family.getCreatedAt())
                .build();
    }

    private FamilyMemberDTO projectionToDTO(FamilyMemberProjection familyMember) {

        return FamilyMemberDTO.builder()
                .id(familyMember.getId())
                .familyId(familyMember.getFamilyId())
                .memberEmail(familyMember.getMemberEmail())
                .nickname(familyMember.getNickname())
                .familyRole(familyMember.getFamilyRole())
                .parentType(familyMember.getParentType())
                .joinedAt(familyMember.getJoinedAt())
                .build();
    }
}
