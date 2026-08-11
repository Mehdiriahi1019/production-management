import axiosInstance from "../../../../api/axiosinstance";
import { API_URL } from "../../../../api/api";

// ======== اختصاص چند سمت به چند کاربر ========
// payload: { positions: [{ user_id, position_id, is_primary }, ...] }
const addPositionsToUsers = async (positions) => {
  const ADD_POSITIONS_TO_USERS_URL = `${API_URL}/api/auth/identify/assign/users/positions/`;
  const response = await axiosInstance.post(ADD_POSITIONS_TO_USERS_URL, { positions });
  return response.data.data;
};

const AddPositionsToUsersService = { addPositionsToUsers };

export default AddPositionsToUsersService;