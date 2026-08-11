// features/auth/positions/Positiondetail/Positiondetailthunk.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getPositionDetailService } from "./Positiondetailservice";

export const getPositionDetailThunk = createAsyncThunk(
  "positionDetail/getPositionDetail",
  async (positionId, { rejectWithValue }) => {
    try {
      const response = await getPositionDetailService(positionId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);