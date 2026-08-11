import { createSlice } from "@reduxjs/toolkit";
import { getUsersThunk } from "./usersThunk";

const initialState = {
  users: [],
  loading: false,
  error: null,
  loaded: false, // اضافه شد
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetUsers: (state) => {
      state.users = [];
      state.loading = false;
      state.error = null;
      state.loaded = false;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(getUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.loaded = false; // اضافه شد
      })

      .addCase(getUsersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload?.data || action.payload || [];
        state.loaded = true; // اضافه شد
      })

      .addCase(getUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.loaded = false; // اضافه شد
      });
  },
});

export const { resetUsers } = usersSlice.actions;
export default usersSlice.reducer;