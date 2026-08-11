// features/auth/positions/positionsSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { getPositionsThunk } from "./Positionthunk";

const initialState = {
  positions: [],
  loading: false,
  error: null,
  loaded: false,

  // ======== نتایج سرچ سمت سرور (وقتی search پاس داده بشه) ========
  // جدا از positions نگه داشته می‌شه تا سرچ، کش لیست کامل رو خراب نکنه
  searchResults: [],
  searchLoading: false,
  searchError: null,
};

const positionsSlice = createSlice({
  name: "positions",
  initialState,
  reducers: {
    resetPositions: (state) => {
      state.positions = [];
      state.loading = false;
      state.error = null;
      state.loaded = false;
      state.searchResults = [];
      state.searchLoading = false;
      state.searchError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPositionsThunk.pending, (state, action) => {
        const isSearch = !!action.meta?.arg?.search;
        if (isSearch) {
          state.searchLoading = true;
          state.searchError = null;
        } else {
          state.loading = true;
          state.error = null;
          state.loaded = false;
        }
      })
      .addCase(getPositionsThunk.fulfilled, (state, action) => {
        const isSearch = !!action.meta?.arg?.search;
        const data = action.payload?.data || action.payload || [];

        if (isSearch) {
          state.searchLoading = false;
          state.searchResults = data;
        } else {
          state.loading = false;
          state.positions = data;
          state.loaded = true;
        }
      })
      .addCase(getPositionsThunk.rejected, (state, action) => {
        const isSearch = !!action.meta?.arg?.search;
        if (isSearch) {
          state.searchLoading = false;
          state.searchError = action.payload;
        } else {
          state.loading = false;
          state.error = action.payload;
          state.loaded = false;
        }
      });
  },
});

export const { resetPositions } = positionsSlice.actions;
export default positionsSlice.reducer;