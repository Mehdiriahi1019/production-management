// features/users/usersPosition/UsersPositionSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { getUsersPositionThunk } from "./UsersPositionThunk";

const initialState = {
  data: null, 
  loading: false,
  error: null,
  loaded: false,
};

const usersPositionSlice = createSlice({
  name: "usersPosition",
  initialState,
  reducers: {
    resetUsersPosition: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.loaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUsersPositionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.loaded = false;
      })
      .addCase(getUsersPositionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload?.data || action.payload || null;
        state.loaded = true;
      })
      .addCase(getUsersPositionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.loaded = false;
      });
  },
});

export const { resetUsersPosition } = usersPositionSlice.actions;
export default usersPositionSlice.reducer;