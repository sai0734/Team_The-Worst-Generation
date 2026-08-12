// matches the JSON returned by login/kakao/refresh endpoints,
// which is MemberDTO.getClaims() (com.backend.dto.MemberDTO) plus JWT tokens
export interface LoginState {
  email: string;
  nickname?: string;
  social?: boolean;
  roleNames?: string[];
}

export interface LoginResponse extends LoginState {
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface KakaoLoginSuccess extends LoginResponse {
  status: "LOGIN";
}

export interface KakaoLoginPending {
  status: "NEED_ACCOUNT_AUTH" | "NEED_SIGNUP";
  email: string | null;
  socialLinkToken: string;
}

export type KakaoLoginResponse = KakaoLoginSuccess | KakaoLoginPending;

export interface SocialLoginNavigationState {
  email: string | null;
  socialLinkToken: string;
}

export interface SocialSignupParam {
  email: string;
  pw: string;
  nickname: string;
  socialLinkToken: string;
}

export interface AuthError {
  error: string;
}

export interface LoginParam {
  email: string;
  pw: string;
}

export interface MemberSignupParam {
  email: string;
  pw: string;
  nickname: string;
}

export interface MemberSignupResponse extends LoginResponse {
  status: "LOGIN";
}

// matches com.backend.dto.MemberModifyDTO
export interface MemberModify {
  email: string;
  pw: string;
  nickname: string;
}
