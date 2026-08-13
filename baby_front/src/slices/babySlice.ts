import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BabyInfo } from "../api/babyInfoApi";

export interface BabyState {
  currentBaby: BabyInfo | null;
}

const initState: BabyState = {
  currentBaby: null,
};

const babySlice = createSlice({
  name: "BabySlice",
  initialState: initState,
  reducers: {
    setCurrentBaby: (state, action: PayloadAction<BabyInfo>) => {
      state.currentBaby = action.payload;
    },
    clearCurrentBaby: (state) => {
      state.currentBaby = null;
    },
  },
});

export const { setCurrentBaby, clearCurrentBaby } = babySlice.actions;
export default babySlice.reducer;
