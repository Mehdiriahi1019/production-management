// features/auth/positions/positionsSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { getPositionsThunk } from "./Positionthunk";

const initialState = {
  positions: [],
  loading: false,
  error: null,
  loaded: false,
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPositionsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.loaded = false;
      })
      .addCase(getPositionsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.positions = action.payload?.data || action.payload || [];
        state.loaded = true;
      })
      .addCase(getPositionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.loaded = false;
      });
  },
});

export const { resetPositions } = positionsSlice.actions;
export default positionsSlice.reducer;