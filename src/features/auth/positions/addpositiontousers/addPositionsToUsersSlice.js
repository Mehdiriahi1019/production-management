import { createSlice } from "@reduxjs/toolkit";
import { addPositionsToUsersThunk } from "./AddPositionsToUsersThunk";

const initialState = {
  loading: false,
  error: null,
  success: false,
};

const addPositionsToUsersSlice = createSlice({
  name: "addPositionsToUsers",
  initialState,
  reducers: {
    resetAddPositionsToUsersStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addPositionsToUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addPositionsToUsersThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(addPositionsToUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetAddPositionsToUsersStatus } = addPositionsToUsersSlice.actions;
export default addPositionsToUsersSlice.reducer;