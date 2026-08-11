import { createAsyncThunk } from "@reduxjs/toolkit";
import UnassignPositionsService from "./Unassignpositionsservice";

export const unassignPositionsThunk = createAsyncThunk(
  "positions/unassignPositions",
  async (positionIds, { rejectWithValue }) => {
    try {
      const data = await UnassignPositionsService.unassignPositions(positionIds);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);