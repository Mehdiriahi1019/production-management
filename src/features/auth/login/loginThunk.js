import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginService } from "./loginService";

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const response = await loginService(data);
      console.log(response);
      return response;

    } catch (error) {
      // فقط چیزی که واقعاً از سرور اومده پاس داده می‌شه، نه متن دستی.
      // اگه error.response وجود داشته باشه یعنی سرور جواب داده (مثلاً 400/401)
      // و بدنه‌ی پاسخ (پیام‌های fa/en، errors و ...) توی error.response.data هست.
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }

      // اگه پاسخی از سرور نرسیده (قطعی شبکه، CORS، timeout و ...) یا خطای دیگه‌ای بود،
      // هیچ متنی اینجا ساخته نمی‌شه؛ فقط پیام خام همون error رو پاس می‌دیم
      // تا هر جا (مثلاً LoginPage) خودش تصمیم بگیره چطور نمایشش بده.
      return rejectWithValue(error.message);
    }
  }
);