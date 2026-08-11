import { createAsyncThunk } from "@reduxjs/toolkit";
import CreatePositionService from "./CreatePositionService";

export const createPositionThunk = createAsyncThunk(
  "positionsList/createPosition",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await CreatePositionService.createPosition(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);