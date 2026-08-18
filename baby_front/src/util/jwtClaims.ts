import type { CurrentProfile, ParentType } from "../types/profile";

interface AccessTokenClaims {
  profileId?: unknown;
  profileName?: unknown;
  parentType?: unknown;
}

const isParentType = (value: unknown): value is ParentType => {
  return value === "FATHER" || value === "MOTHER";
};

const decodeBase64Url = (value: string): string => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (character) =>
    character.charCodeAt(0),
  );

  return new TextDecoder().decode(bytes);
};

export const getAccessTokenClaims = (
  accessToken: string,
): AccessTokenClaims | null => {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload)) as AccessTokenClaims;
  } catch {
    return null;
  }
};

export const getCurrentProfileFromAccessToken = (
  accessToken: string,
): CurrentProfile | null => {
  const claims = getAccessTokenClaims(accessToken);
  const profileId = Number(claims?.profileId);

  if (
    !Number.isSafeInteger(profileId) ||
    profileId <= 0 ||
    typeof claims?.profileName !== "string" ||
    !claims.profileName.trim() ||
    !isParentType(claims.parentType)
  ) {
    return null;
  }

  return {
    profileId,
    profileName: claims.profileName,
    parentType: claims.parentType,
  };
};
