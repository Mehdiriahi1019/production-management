import { createAsyncThunk } from "@reduxjs/toolkit";
import PositionsListService from "./PositionsListService";

export const getPositionsListThunk = createAsyncThunk(
  "positionsList/getPositionsList",
  async (params, { rejectWithValue }) => {
    try {
      const data = await PositionsListService.getPositionsList(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);