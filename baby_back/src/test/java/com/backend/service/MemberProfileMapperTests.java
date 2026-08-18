package com.backend.mapper;

import com.backend.auth.domain.Member;
import com.backend.auth.domain.MemberRole;
import com.backend.auth.mapper.MemberMapper;
import com.backend.auth.profile.domain.MemberProfile;
import com.backend.auth.profile.mapper.MemberProfileMapper;
import com.backend.family.domain.ParentType;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "google.vision.api-key=dummy_test_key"
})
@Log4j2
public class MemberProfileMapperTests {

    @Autowired
    private MemberMapper memberMapper;

    @Autowired
    private MemberProfileMapper memberProfileMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void insertAndSelectMemberProfile() {
        String email = "profile-test@aaa.com";

        if (memberMapper.selectByEmail(email) == null) {
            Member member = Member.builder()
                    .email(email)
                    .pw(passwordEncoder.encode("1111"))
                    .nickname("PROFILE_TEST")
                    .build();

            member.addRole(MemberRole.USER);

            memberMapper.insert(member);
            memberMapper.insertRole(email, MemberRole.USER.name());
        }

        MemberProfile momProfile = MemberProfile.builder()
                .memberEmail(email)
                .profileName("엄마")
                .parentType(ParentType.MOTHER)
                .profileImageFileName(null)
                .active(true)
                .build();

        memberProfileMapper.insert(momProfile);

        assertThat(momProfile.getProfileId()).isNotNull();

        MemberProfile selected = memberProfileMapper.selectByProfileId(momProfile.getProfileId());

        assertThat(selected).isNotNull();
        assertThat(selected.getMemberEmail()).isEqualTo(email);
        assertThat(selected.getProfileName()).isEqualTo("엄마");
        assertThat(selected.getParentType()).isEqualTo(ParentType.MOTHER);
        assertThat(selected.isActive()).isTrue();

        List<MemberProfile> profiles = memberProfileMapper.selectListByMemberEmail(email);

        assertThat(profiles)
                .extracting(MemberProfile::getProfileId)
                .contains(momProfile.getProfileId());
    }

    @Test
    public void updateMemberProfile() {
        String email = "profile-update-test@aaa.com";

        if (memberMapper.selectByEmail(email) == null) {
            Member member = Member.builder()
                    .email(email)
                    .pw(passwordEncoder.encode("1111"))
                    .nickname("PROFILE_UPDATE_TEST")
                    .build();

            member.addRole(MemberRole.USER);

            memberMapper.insert(member);
            memberMapper.insertRole(email, MemberRole.USER.name());
        }

        MemberProfile profile = MemberProfile.builder()
                .memberEmail(email)
                .profileName("엄마")
                .parentType(ParentType.MOTHER)
                .active(true)
                .build();

        memberProfileMapper.insert(profile);

        MemberProfile updated = MemberProfile.builder()
                .profileId(profile.getProfileId())
                .memberEmail(email)
                .profileName("아빠")
                .parentType(ParentType.FATHER)
                .profileImageFileName("dad.png")
                .active(true)
                .build();

        memberProfileMapper.update(updated);

        MemberProfile selected = memberProfileMapper.selectByProfileId(profile.getProfileId());

        assertThat(selected.getProfileName()).isEqualTo("아빠");
        assertThat(selected.getParentType()).isEqualTo(ParentType.FATHER);
        assertThat(selected.getProfileImageFileName()).isEqualTo("dad.png");
    }

    @Test
    public void deactivateMemberProfile() {
        String email = "profile-delete-test@aaa.com";

        if (memberMapper.selectByEmail(email) == null) {
            Member member = Member.builder()
                    .email(email)
                    .pw(passwordEncoder.encode("1111"))
                    .nickname("PROFILE_DELETE_TEST")
                    .build();

            member.addRole(MemberRole.USER);

            memberMapper.insert(member);
            memberMapper.insertRole(email, MemberRole.USER.name());
        }

        MemberProfile profile = MemberProfile.builder()
                .memberEmail(email)
                .profileName("엄마")
                .parentType(ParentType.MOTHER)
                .active(true)
                .build();

        memberProfileMapper.insert(profile);

        memberProfileMapper.deactivate(profile.getProfileId());

        MemberProfile selected = memberProfileMapper.selectByProfileId(profile.getProfileId());

        assertThat(selected).isNull();
    }
}