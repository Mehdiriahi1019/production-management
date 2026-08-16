import { createAsyncThunk } from "@reduxjs/toolkit";
import { createServiceApi } from "./serviceCreateService";

export const createServiceThunk = createAsyncThunk(
  "services/createService",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await createServiceApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { fa: "خطا در ساخت خدمت جدید" }
      );
    }
  }
);