import { useSelector } from "react-redux";
import type { RootState } from "../store";
import type { CurrentProfile } from "../types/profile";

const useCurrentProfile = (): CurrentProfile | null => {
  return useSelector((state: RootState) => {
    const { profileId, profileName, parentType } = state.loginSlice;

    if (!profileId || !profileName || !parentType) {
      return null;
    }

    return { profileId, profileName, parentType };
  });
};

export default useCurrentProfile;
