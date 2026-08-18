export type ParentType = "FATHER" | "MOTHER";

export interface MemberProfile {
  profileId: number;
  memberEmail: string;
  profileName: string;
  parentType: ParentType;
  profileImageFileName: string | null;
  active: boolean;
  regTime: string;
  modTime: string;
}

export interface CurrentProfile {
  profileId: number;
  profileName: string;
  parentType: ParentType;
}

export interface ProfileSaveRequest {
  profileName: string;
  parentType: ParentType;
  profileImageFileName: string | null;
}

export interface ProfileCreateResponse {
  profileId: number;
}

export interface ProfileResultResponse {
  RESULT: "SUCCESS";
}

export interface ProfileSelectRequest {
  profileId: number;
}

export interface ProfileSelectResponse extends CurrentProfile {
  accessToken: string;
}
