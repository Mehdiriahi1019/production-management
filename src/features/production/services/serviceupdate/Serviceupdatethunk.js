import { createAsyncThunk } from "@reduxjs/toolkit";
import { updateServiceApi } from "./serviceupdateservice";

// ویرایش یک سرویس بر اساس آیدی
// payload باید دقیقاً همون فرمتی باشه که سرور انتظار داره:
// { display_name, code, updated_at }
export const updateService = createAsyncThunk(
  "serviceDetail/updateService",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await updateServiceApi(id, payload);
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
        fa: "خطا در ثبت ویرایش",
      });
    }
  }
);