import type { MemberProfile, ParentType } from "../../../types/profile";
import EmptyProfileCard from "./EmptyProfileCard";
import ProfileCard from "./ProfileCard";

interface ProfileListProps {
  profiles: MemberProfile[];
  selectingId: number | null;
  onSelect: (profileId: number) => void;
  onEdit: (profile: MemberProfile) => void;
  onDelete: (profile: MemberProfile) => void;
  onCreate: (parentType: ParentType) => void;
}

const ProfileList = ({ profiles, selectingId, onSelect, onEdit, onDelete, onCreate }: ProfileListProps) => {
  const profilesByType = new Map(profiles.map((profile) => [profile.parentType, profile]));

  return (
    <div className="profile-grid">
      {(["FATHER", "MOTHER"] as const).map((parentType) => {
        const profile = profilesByType.get(parentType);

        return profile ? (
          <ProfileCard
            key={parentType}
            profile={profile}
            selecting={selectingId === profile.profileId}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : (
          <EmptyProfileCard key={parentType} parentType={parentType} onCreate={onCreate} />
        );
      })}
    </div>
  );
};

export default ProfileList;
