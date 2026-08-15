import { createAsyncThunk } from "@reduxjs/toolkit";
import { getServiceDetailApi } from "./servicedetailservice";

// دریافت جزئیات یک سرویس بر اساس آیدی
export const getServiceDetail = createAsyncThunk(
  "serviceDetail/getServiceDetail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getServiceDetailApi(id);
      // پاسخ سرور در قالب envelope هست: { success, message, data, meta }
      return response.data.data;
    } catch (error) {
      // پیام خطا معمولاً به‌صورت { en, fa } توی response.data.message هست
      const serverMessage = error?.response?.data?.message;
      if (serverMessage && typeof serverMessage === "object") {
        return rejectWithValue(serverMessage);
      }
      if (typeof serverMessage === "string") {
        return rejectWithValue({ en: serverMessage, fa: serverMessage });
      }
      return rejectWithValue({
        en: "Something went wrong",
        fa: "خطا در دریافت اطلاعات",
      });
    }
  }
);