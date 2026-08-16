import { createSlice } from "@reduxjs/toolkit";
import { getPaintDetailThunk } from "./paintdetailthunk";

const initialState = {
  data: null,
  loading: false,
  error: null,
};

const paintDetailSlice = createSlice({
  name: "paintDetail",
  initialState,
  reducers: {
    clearPaintDetail: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPaintDetailThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaintDetailThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getPaintDetailThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPaintDetail } = paintDetailSlice.actions;
export default paintDetailSlice.reducer;