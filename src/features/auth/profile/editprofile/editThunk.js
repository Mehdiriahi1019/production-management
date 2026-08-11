import { createAsyncThunk } from "@reduxjs/toolkit";
import { editService } from "./editService";

export const editThunk = createAsyncThunk(
  "profile/edit",
  async (data, thunkAPI) => {
    try {
      const response = await editService(data);
      return response.data.data;

    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);