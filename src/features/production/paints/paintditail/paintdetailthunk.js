import { createAsyncThunk } from "@reduxjs/toolkit";
import { getPaintDetailApi } from "./paintdetailservice";

export const getPaintDetailThunk = createAsyncThunk(
  "paintDetail/getPaintDetail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getPaintDetailApi(id);
      return response.data.data;
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      if (serverMessage && typeof serverMessage === "object") {
        return rejectWithValue(serverMessage);
      }
      if (typeof serverMessage === "string") {
        return rejectWithValue({ en: serverMessage, fa: serverMessage });
      }
      return rejectWithValue({
        en: "Something went wrong",
        fa: "خطا در دریافت جزئیات رنگ",
      });
    }
  }
);