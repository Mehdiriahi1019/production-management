import axiosInstance from "../../../api/axiosinstance";
import { API_URL } from "../../../api/api";

const LOGIN_API = `${API_URL}/api/auth/identify/login/`

export const loginService = async (data) => {
  try {
    const response = await axiosInstance.post(LOGIN_API, data);
    
    // استخراج توکن‌ها از response.data.data
    const tokens = response.data?.data;
    
    if (tokens?.access) {
      localStorage.setItem("accessToken", tokens.access);
    }
    if (tokens?.refresh) {
      localStorage.setItem("refreshToken", tokens.refresh);
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};