package com.backend.auth.profile.service;

import com.backend.auth.profile.domain.MemberProfile;
import com.backend.auth.profile.dto.MemberProfileDTO;
import com.backend.auth.profile.mapper.MemberProfileMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class MemberProfileServiceImpl implements MemberProfileService {

    private final MemberProfileMapper memberProfileMapper;

    @Override
    public Long register(String memberEmail, MemberProfileDTO memberProfileDTO) {
        validateProfileRequest(memberProfileDTO);

        MemberProfile memberProfile = MemberProfile.builder()
                .memberEmail(memberEmail)
                .profileName(memberProfileDTO.getProfileName())
                .parentType(memberProfileDTO.getParentType())
                .profileImageFileName(memberProfileDTO.getProfileImageFileName())
                .active(true)
                .build();

        memberProfileMapper.insert(memberProfile);

        return memberProfile.getProfileId();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberProfileDTO> listMine(String memberEmail) {
        return memberProfileMapper.selectListByMemberEmail(memberEmail)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Override
    public void modify(String memberEmail, Long profileId, MemberProfileDTO memberProfileDTO) {
        validateProfileRequest(memberProfileDTO);

        MemberProfile savedProfile = findOwnedProfileOrThrow(memberEmail, profileId);

        MemberProfile memberProfile = MemberProfile.builder()
                .profileId(savedProfile.getProfileId())
                .memberEmail(savedProfile.getMemberEmail())
                .profileName(memberProfileDTO.getProfileName())
                .parentType(memberProfileDTO.getParentType())
                .profileImageFileName(memberProfileDTO.getProfileImageFileName())
                .active(true)
                .build();

        memberProfileMapper.update(memberProfile);
    }

    @Override
    public void remove(String memberEmail, Long profileId) {
        findOwnedProfileOrThrow(memberEmail, profileId);

        memberProfileMapper.deactivate(profileId);
    }

    @Override
    @Transactional(readOnly = true)
    public MemberProfileDTO selectProfile(String memberEmail, Long profileId) {
        MemberProfile memberProfile = findOwnedProfileOrThrow(memberEmail, profileId);

        return toDTO(memberProfile);
    }

    private MemberProfile findOwnedProfileOrThrow(String memberEmail, Long profileId) {
        MemberProfile memberProfile = Optional
                .ofNullable(memberProfileMapper.selectByProfileId(profileId))
                .orElseThrow(() -> new NoSuchElementException("PROFILE_NOT_FOUND"));

        if (!memberProfile.getMemberEmail().equals(memberEmail)) {
            throw new AccessDeniedException("PROFILE_ACCESS_DENIED");
        }

        return memberProfile;
    }

    private void validateProfileRequest(MemberProfileDTO memberProfileDTO) {
        if (memberProfileDTO == null
                || memberProfileDTO.getProfileName() == null
                || memberProfileDTO.getProfileName().isBlank()
                || memberProfileDTO.getParentType() == null) {
            throw new IllegalArgumentException("INVALID_PROFILE_REQUEST");
        }
    }

    private MemberProfileDTO toDTO(MemberProfile memberProfile) {
        return MemberProfileDTO.builder()
                .profileId(memberProfile.getProfileId())
                .memberEmail(memberProfile.getMemberEmail())
                .profileName(memberProfile.getProfileName())
                .parentType(memberProfile.getParentType())
                .profileImageFileName(memberProfile.getProfileImageFileName())
                .active(memberProfile.isActive())
                .regTime(memberProfile.getRegTime())
                .modTime(memberProfile.getModTime())
                .build();
    }
}
