import axiosInstance from "../../../../api/axiosInstance";
import { API_URL } from "../../../../api/api";

const getUserDetails = async (id) => {
  const USER_DETAILS_URL = `${API_URL}/api/auth/identify/user-details/${id}/`;
  const response = await axiosInstance.get(USER_DETAILS_URL);
  return response.data.data;
};

const UserDetailsService = { getUserDetails };

export default UserDetailsService;