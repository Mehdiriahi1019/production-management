import { createSlice } from "@reduxjs/toolkit";
import { getUserDetailsThunk } from "./userditailthunk";

const initialState = {
  user: null,
  loading: false,
  error: null,
};

const userDetailsSlice = createSlice({
  name: "userDetails",
  initialState,
  reducers: {
    resetUserDetails: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserDetailsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getUserDetailsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetUserDetails } = userDetailsSlice.actions;
export default userDetailsSlice.reducer;