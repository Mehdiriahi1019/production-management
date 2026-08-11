import axiosInstance from "../../../api/axiosInstance";
import { API_URL } from "../../../api/api";

const PROFILE_API = `${API_URL}/api/auth/identify/me/`;

export const getProfileService = async () => {
  try {
    const response = await axiosInstance.get(PROFILE_API);

    // response.data خودش envelope سرور است: {success, message, data, meta}
    // دیتای واقعی پروفایل داخل response.data.data قرار داره
    return response.data.data;

  } catch (error) {
    throw error.response?.data || error.message;
  }
};