import { createAsyncThunk } from "@reduxjs/toolkit";
import { getServicesForSelectApi } from "./ServicesForSelectService";

export const getServicesForSelectThunk = createAsyncThunk(
  "servicesForSelect/getServicesForSelect",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getServicesForSelectApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { fa: "خطا در دریافت لیست خدمات" }
      );
    }
  }
);