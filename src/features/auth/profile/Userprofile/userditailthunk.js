import { createAsyncThunk } from "@reduxjs/toolkit";
import UserDetailsService from "./Userditailservice";

export const getUserDetailsThunk = createAsyncThunk(
  "users/getUserDetails",
  async (id, { rejectWithValue }) => {
    try {
      const data = await UserDetailsService.getUserDetails(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);