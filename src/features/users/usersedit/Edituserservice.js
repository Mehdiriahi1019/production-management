import axiosInstance from "../../../api/axiosInstance";
import { API_URL } from "../../../api/api";

const editUser = async (id, payload) => {
  const EDITUSER_URL = `${API_URL}/api/auth/identify/edit-user-admin/${id}/`;
  const response = await axiosInstance.patch(EDITUSER_URL, payload);
  // کل envelope (success, message, data) برگردونده می‌شه تا پیام موفقیت سرور
  // توی مودال قابل نمایش باشه؛ اگه فقط response.data.data برگردونی، پیام سرور از دست می‌ره
  return response.data;
};

const EditUserService = { editUser };

export default EditUserService;