import type { ParentType } from "../../../types/profile";
import fatherAvatar from "../../../assets/profiles/default-father.png";
import motherAvatar from "../../../assets/profiles/default-mother.png";

interface ProfileAvatarProps {
  profileName: string;
  parentType: ParentType;
}

const ProfileAvatar = ({ profileName, parentType }: ProfileAvatarProps) => {
  const avatarSource = parentType === "FATHER" ? fatherAvatar : motherAvatar;

  return (
    <div className={`profile-avatar ${parentType.toLowerCase()}`} aria-hidden="true">
      <img src={avatarSource} alt="" title={`${profileName} 기본 프로필`} />
    </div>
  );
};

export default ProfileAvatar;
