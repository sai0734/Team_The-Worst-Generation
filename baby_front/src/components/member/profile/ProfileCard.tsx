import type { MemberProfile } from "../../../types/profile";
import ProfileAvatar from "./ProfileAvatar";

interface ProfileCardProps {
  profile: MemberProfile;
  selecting: boolean;
  onSelect: (profileId: number) => void;
  onEdit: (profile: MemberProfile) => void;
  onDelete: (profile: MemberProfile) => void;
}

const ProfileCard = ({
  profile,
  selecting,
  onSelect,
  onEdit,
  onDelete,
}: ProfileCardProps) => {
  return (
    <article className={`card profile-card${profile.active ? " is-selected" : ""}`}>
      <button
        type="button"
        className="profile-card-main"
        disabled={selecting}
        onClick={() => onSelect(profile.profileId)}
        aria-label={`${profile.profileName} 프로필로 시작`}
      >
        <ProfileAvatar profileName={profile.profileName} parentType={profile.parentType} />
        <div className="profile-card-title-row">
          <h3>{profile.profileName}</h3>
          {profile.active && <span className="profile-selected-badge">현재 프로필</span>}
        </div>
        <p>{selecting ? "선택 중..." : `${profile.parentType === "FATHER" ? "아빠" : "엄마"}로 시작하기`}</p>
      </button>

      <div className="profile-card-actions">
        <button type="button" className="ghost-btn" onClick={() => onEdit(profile)}>
          수정
        </button>
        <button
          type="button"
          className="ghost-btn profile-delete-button"
          onClick={() => onDelete(profile)}
        >
          삭제
        </button>
      </div>
    </article>
  );
};

export default ProfileCard;
