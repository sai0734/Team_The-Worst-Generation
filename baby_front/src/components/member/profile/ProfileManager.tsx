import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as profileApi from "../../../api/profileApi";
import type { MemberProfile, ParentType, ProfileSaveRequest } from "../../../types/profile";
import ProfileForm from "./ProfileForm";
import ProfileList from "./ProfileList";

const getProfileErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";

  switch (error.response?.status) {
    case 400:
      return "입력한 프로필 정보를 다시 확인해주세요.";
    case 401:
      return "로그인 정보가 만료되었습니다. 다시 로그인해주세요.";
    case 403:
      return "이 프로필을 사용할 권한이 없습니다.";
    case 404:
      return "프로필을 찾을 수 없습니다.";
    default:
      return "프로필 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};

const ProfileManager = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingProfile, setEditingProfile] = useState<MemberProfile | null>(null);
  const [formParentType, setFormParentType] = useState<ParentType>("FATHER");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const loadProfiles = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      setProfiles(await profileApi.getMyProfiles());
    } catch (error: unknown) {
      setErrorMessage(getProfileErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    profileApi
      .getMyProfiles()
      .then(setProfiles)
      .catch((error: unknown) => setErrorMessage(getProfileErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const openCreateForm = (parentType: ParentType) => {
    setEditingProfile(null);
    setFormParentType(parentType);
    setShowForm(true);
  };

  const openEditForm = (profile: MemberProfile) => {
    setEditingProfile(profile);
    setFormParentType(profile.parentType);
    setShowForm(true);
  };

  const handleSave = async (request: ProfileSaveRequest) => {
    setSubmitting(true);
    setErrorMessage("");
    try {
      if (editingProfile) {
        await profileApi.updateProfile(editingProfile.profileId, request);
      } else {
        await profileApi.createProfile(request);
      }
      setShowForm(false);
      setEditingProfile(null);
      await loadProfiles();
    } catch (error: unknown) {
      setErrorMessage(getProfileErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (profile: MemberProfile) => {
    if (!window.confirm(`'${profile.profileName}' 프로필을 삭제할까요?`)) return;

    setErrorMessage("");
    try {
      await profileApi.deleteProfile(profile.profileId);
      await loadProfiles();
    } catch (error: unknown) {
      setErrorMessage(getProfileErrorMessage(error));
    }
  };

  const handleSelect = async (profileId: number) => {
    setSelectingId(profileId);
    setErrorMessage("");
    try {
      await profileApi.selectProfile({ profileId });
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      setErrorMessage(getProfileErrorMessage(error));
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <section className="profile-page-shell">
      <div className="profile-page-heading">
        <div>
          <p className="eyebrow">WHO IS USING?</p>
          <h1>누가 사용하고 있나요?</h1>
          <p className="desc">사용할 가족 프로필을 선택해주세요.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="profile-alert" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage("")}>닫기</button>
        </div>
      )}

      {loading ? (
        <div className="card profile-state-card">프로필을 불러오는 중입니다...</div>
      ) : (
        !showForm && (
          <ProfileList
            profiles={profiles}
            selectingId={selectingId}
            onSelect={handleSelect}
            onEdit={openEditForm}
            onDelete={handleDelete}
            onCreate={openCreateForm}
          />
        )
      )}

      {showForm && (
        <ProfileForm
          key={editingProfile?.profileId ?? "new"}
          profile={editingProfile}
          parentType={formParentType}
          submitting={submitting}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </section>
  );
};

export default ProfileManager;
