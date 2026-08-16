// features/production/paintslist/PaintslistSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { getPaintsListThunk } from "./PaintslistThunk";

const initialState = {
  paints: [],
  loading: false,
  error: null,
  loaded: false,
  total: 0,
  next: null,
  previous: null,
};

const paintsListSlice = createSlice({
  name: "paintsList",
  initialState,
  reducers: {
    resetPaintsList: (state) => {
      state.paints = [];
      state.loading = false;
      state.error = null;
      state.loaded = false;
      state.total = 0;
      state.next = null;
      state.previous = null;
    },
    clearPaintsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPaintsListThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaintsListThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.paints = action.payload?.data?.results || action.payload?.data || [];
        state.total = action.payload?.data?.count || 0;
        state.next = action.payload?.data?.next || null;
        state.previous = action.payload?.data?.previous || null;
        state.error = null;
      })
      .addCase(getPaintsListThunk.rejected, (state, action) => {
        state.loading = false;
        state.loaded = false;
        state.error = action.payload || action.error?.message || { message: { fa: "خطا در دریافت لیست رنگ‌ها" } };
      });
  },
});

export const { resetPaintsList, clearPaintsError } = paintsListSlice.actions;
export default paintsListSlice.reducer;