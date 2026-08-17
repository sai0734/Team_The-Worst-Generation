import type { ParentType } from "../../../types/profile";
import ProfileAvatar from "./ProfileAvatar";

interface EmptyProfileCardProps {
  parentType: ParentType;
  onCreate: (parentType: ParentType) => void;
}

const EmptyProfileCard = ({ parentType, onCreate }: EmptyProfileCardProps) => {
  const label = parentType === "FATHER" ? "아빠" : "엄마";

  return (
    <article className="card profile-card profile-card-empty">
      <button type="button" className="profile-card-main" onClick={() => onCreate(parentType)}>
        <ProfileAvatar profileName={label} parentType={parentType} />
        <div className="profile-card-title-row"><h3>{label} 프로필 추가</h3></div>
        <p>프로필 정보를 입력해주세요.</p>
      </button>
    </article>
  );
};

export default EmptyProfileCard;
