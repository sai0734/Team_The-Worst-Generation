import { configureStore } from "@reduxjs/toolkit";
import loginSlice, { syncProfileFromAccessToken } from "./slices/loginSlice";
import babySlice from "./slices/babySlice";
import { registerAccessTokenSyncHandler } from "./util/authStateSync";

const store = configureStore({
  reducer: {
    loginSlice: loginSlice,
    babySlice: babySlice,
  },
});

registerAccessTokenSyncHandler((accessToken) => {
  store.dispatch(syncProfileFromAccessToken(accessToken));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
