import { createAsyncThunk } from "@reduxjs/toolkit";
import PositionsService from "./Positionservice";

export const getPositionsThunk = createAsyncThunk(
  "positions/getPositions",
  async (_, { rejectWithValue }) => {
    try {
      const data = await PositionsService.getPositions();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);