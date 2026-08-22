// features/production/paintslist/PaintslistThunk.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { paintslistservice } from "./Paintslistservice";

export const getPaintsListThunk = createAsyncThunk(
  "paintsList/getPaintsList",
  async (params={}, { rejectWithValue }) => {
    try {
      const response = await paintslistservice(params);
      return response.data;
    } catch (error) {
      // ارسال کامل خطای سرور بدون تغییر
      return rejectWithValue(
        error.response?.data || 
        error.message || 
        { message: { fa: "خطا در دریافت لیست رنگ‌ها" } }
      );
    }
  }
);