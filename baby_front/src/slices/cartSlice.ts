import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getCartItems, postChangeCart } from "../api/cartApi";
import type { CartChangeParam, CartItem } from "../types/cart";

export const getCartItemsAsync = createAsyncThunk("getCartItemsAsync", () => {
  return getCartItems();
});

export const postChangeCartAsync = createAsyncThunk(
  "postCartItemsAsync",
  (param: CartChangeParam) => {
    return postChangeCart(param);
  },
);

const initState: CartItem[] = [];

const cartSlice = createSlice({
  name: "cartSlice",
  initialState: initState,

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(
        getCartItemsAsync.fulfilled,
        (_state, action: PayloadAction<CartItem[]>) => {
          console.log("getCartItemsAsync fulfilled");

          return action.payload;
        },
      )
      .addCase(
        postChangeCartAsync.fulfilled,
        (_state, action: PayloadAction<CartItem[]>) => {
          console.log("postCartItemsAsync fulfilled");

          return action.payload;
        },
      );
  },
});

export default cartSlice.reducer;
