import { createAsyncThunk } from "@reduxjs/toolkit";
import { getUsersPositionService } from "./usersPositionService";

export const getUsersPositionThunk = createAsyncThunk(
  "usersPosition/getUsersPosition",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUsersPositionService();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);