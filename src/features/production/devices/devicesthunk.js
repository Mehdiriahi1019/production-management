import { createAsyncThunk } from "@reduxjs/toolkit";
import { getDevicesListApi } from "./devicesservice";

export const getDevicesListThunk = createAsyncThunk(
  "devicesList/getDevicesList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getDevicesListApi(params);
      return {
        data: response.data.data,
        meta: response.data.meta,
      };
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
        fa: "خطا در دریافت لیست دستگاه‌ها",
      });
    }
  }
);