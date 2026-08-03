// matches the JSON returned by login/kakao/refresh endpoints,
// which is MemberDTO.getClaims() (com.backend.dto.MemberDTO) plus JWT tokens
export interface LoginState {
  email: string;
  pw?: string;
  nickname?: string;
  social?: boolean;
  roleNames?: string[];
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface LoginParam {
  email: string;
  pw: string;
}

// matches com.backend.dto.MemberModifyDTO
export interface MemberModify {
  email: string;
  pw: string;
  nickname: string;
}
