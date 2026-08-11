// features/users/usersPosition/usersPositionService.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

const GETUSERPOSITION_URL = `${API_URL}/api/auth/identify/user-positions/`;

export const getUsersPositionService = async () => {
  try {
    const response = await axiosInstance.get(GETUSERPOSITION_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message || "خطا در دریافت اطلاعات کاربران";
  }
};