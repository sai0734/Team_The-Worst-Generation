import { useState, type FormEvent } from "react";
import type { MemberProfile, ParentType, ProfileSaveRequest } from "../../../types/profile";
import ProfileAvatar from "./ProfileAvatar";

interface ProfileFormProps {
  profile: MemberProfile | null;
  parentType: ParentType;
  submitting: boolean;
  onSave: (request: ProfileSaveRequest) => Promise<void>;
  onCancel: () => void;
}

const ProfileForm = ({ profile, parentType, submitting, onSave, onCancel }: ProfileFormProps) => {
  const [profileName, setProfileName] = useState(profile?.profileName ?? "");
  const [validationMessage, setValidationMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = profileName.trim();

    if (!trimmedName) {
      setValidationMessage("프로필 이름을 입력해주세요.");
      return;
    }

    setValidationMessage("");
    await onSave({
      profileName: trimmedName,
      parentType,
      profileImageFileName: profile?.profileImageFileName ?? null,
    });
  };

  return (
    <form className="card profile-form" onSubmit={handleSubmit}>
      <div className="profile-form-heading">
        <div>
          <p className="eyebrow">{profile ? "EDIT PROFILE" : "NEW PROFILE"}</p>
          <h2>{profile ? "프로필 수정" : "새 프로필 만들기"}</h2>
        </div>
        <button type="button" className="icon-btn-ghost" onClick={onCancel} aria-label="닫기">
          ×
        </button>
      </div>

      <div className="profile-form-identity">
        <ProfileAvatar
          profileName={profileName || (parentType === "FATHER" ? "아빠" : "엄마")}
          parentType={parentType}
        />
        <label className="profile-field">
          <span>프로필 이름</span>
          <input
            value={profileName}
            maxLength={30}
            placeholder="예: 엄마, 아빠"
            onChange={(event) => setProfileName(event.target.value)}
            autoFocus
          />
        </label>
      </div>

      <div className="profile-parent-summary">
        <span>아빠인가요? 엄마인가요?</span>
        <strong>{parentType === "FATHER" ? "아빠" : "엄마"}</strong>
        <small>{parentType}</small>
      </div>

      {validationMessage && <p className="profile-form-error">{validationMessage}</p>}

      <div className="profile-form-actions">
        <button type="button" className="ghost-btn" disabled={submitting} onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
