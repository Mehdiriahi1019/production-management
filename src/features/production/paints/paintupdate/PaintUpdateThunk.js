import { createAsyncThunk } from "@reduxjs/toolkit";
import { updatePaintApi } from "./PaintUpdateService";

export const updatePaintThunk = createAsyncThunk(
  "paints/updatePaint",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await updatePaintApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { fa: "خطا در ویرایش رنگ" }
      );
    }
  }
);