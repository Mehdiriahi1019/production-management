// features/auth/positions/Positiondetail/Positiondetailslice.js
import { createSlice } from "@reduxjs/toolkit";
import { getPositionDetailThunk } from "./Positiondetailthunk";

const initialState = {
  data: null,
  loading: false,
  error: null,
  loaded: false,
};

const positionDetailSlice = createSlice({
  name: "positionDetail",
  initialState,
  reducers: {
    resetPositionDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPositionDetailThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPositionDetailThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.data = action.payload?.data || action.payload;
      })
      .addCase(getPositionDetailThunk.rejected, (state, action) => {
        state.loading = false;
        state.loaded = false;
        state.error = action.payload;
      });
  },
});

export const { resetPositionDetail } = positionDetailSlice.actions;
export default positionDetailSlice.reducer;