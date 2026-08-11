import { createAsyncThunk } from "@reduxjs/toolkit";
import { getProfileService } from "./profileService";

export const getProfileThunk = createAsyncThunk(
  "profile/getProfile",
  async (_, thunkAPI) => {
    try {
      return await getProfileService();
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);