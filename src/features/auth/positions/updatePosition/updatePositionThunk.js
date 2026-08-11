// features/auth/positions/Updateposition/Updatepositionthunk.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { updatePositionService } from "./Updatepositionservice";

export const updatePositionThunk = createAsyncThunk(
  "position/updatePosition",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updatePositionService(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);