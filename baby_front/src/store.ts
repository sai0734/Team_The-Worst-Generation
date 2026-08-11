import { configureStore } from "@reduxjs/toolkit";
import loginSlice from "./slices/loginSlice";
import babySlice from "./slices/babySlice";

const store = configureStore({
  reducer: {
    loginSlice: loginSlice,
    babySlice: babySlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
