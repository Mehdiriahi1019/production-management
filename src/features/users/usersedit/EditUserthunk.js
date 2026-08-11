import { createAsyncThunk } from "@reduxjs/toolkit";
import EditUserService from "./Edituserservice";

export const editUserThunk = createAsyncThunk(
  "users/editUser",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await EditUserService.editUser(id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);