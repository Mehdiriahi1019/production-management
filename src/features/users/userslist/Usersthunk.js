import { createAsyncThunk } from "@reduxjs/toolkit";
import { getUsersService } from "./usersService";

export const getUsersThunk = createAsyncThunk(
  "users/getUsers",
  async (params, thunkAPI) => {
    try {
      return await getUsersService(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);