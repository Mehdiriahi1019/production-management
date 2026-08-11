import axiosInstance from "../../../api/axiosInstance";
import { API_URL } from "../../../api/api";

const USERS_API = `${API_URL}/api/auth/identify/alluser/`;

// params می‌تونه شامل ordering و search باشه، مثلاً:
// getUsersService({ ordering: "-username", search: "ahmad" })
export const getUsersService = async (params = {}) => {
  try {
    const response = await axiosInstance.get(USERS_API, { params });

    // response.data خودش envelope سرور است: {success, message, data, meta}
    // دیتای واقعی لیست یوزرها داخل response.data.data قرار داره
    return response.data.data;

  } catch (error) {
    throw error.response?.data || error.message;
  }
};