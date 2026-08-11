import axiosInstance from "../../../../api/axiosinstance";
import { API_URL } from "../../../../api/api";

const assignPositions = async (userId, positions) => {
  const ASSIGN_URL = `${API_URL}/api/auth/identify/assign/${userId}/`;
  const response = await axiosInstance.post(ASSIGN_URL, { positions });
  return response.data;
};

const AssignPositionsService = { assignPositions };

export default AssignPositionsService;