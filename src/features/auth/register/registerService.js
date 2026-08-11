import axiosInstance from "../../../api/axiosInstance";
import { API_URL } from "../../../api/api";

const REGISTER_API = `${API_URL}/api/auth/identify/register/`;

export const registerService = async (data) => {
  try {
    const response = await axiosInstance.post(REGISTER_API, data);
    console.log("✅ پاسخ موفق:", response);
    return response.data;

  } catch (error) {
    console.log("❌ پاسخ خطا از سرور:", error.response?.data);
    console.log("❌ کد وضعیت:", error.response?.status);
    throw error.response?.data || error.message;
  }
};