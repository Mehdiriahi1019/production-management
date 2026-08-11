import { createAsyncThunk } from "@reduxjs/toolkit";
import AssignPositionsService from "./Assignpositionsservice";

export const assignPositionsThunk = createAsyncThunk(
  "positions/assignPositions",
  async ({ userId, positions }, { rejectWithValue }) => {
    try {
      const data = await AssignPositionsService.assignPositions(userId, positions);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);