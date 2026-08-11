import { createSlice } from "@reduxjs/toolkit";
import { getProfileThunk } from "./profileThunk";

const initialState = {
  profile: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      .addCase(getProfileThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })

      .addCase(getProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default profileSlice.reducer;