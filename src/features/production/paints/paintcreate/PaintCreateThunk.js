import { createAsyncThunk } from "@reduxjs/toolkit";
import { createPaintApi } from "./PaintCreateService";

export const createPaintThunk = createAsyncThunk(
  "paints/createPaint",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await createPaintApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { fa: "خطا در ساخت رنگ جدید" }
      );
    }
  }
);