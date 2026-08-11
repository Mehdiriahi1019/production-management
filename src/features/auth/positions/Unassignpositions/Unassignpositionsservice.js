import axiosInstance from "../../../../api/axiosinstance";
import { API_URL } from "../../../../api/api";

const unassignPositions = async (positionIds) => {
  const UNASSIGN_URL = `${API_URL}/api/auth/identify/unassign/`;
  const response = await axiosInstance.post(UNASSIGN_URL, {
    position_ids: positionIds,
  });
  return response.data;
};

const UnassignPositionsService = { unassignPositions };

export default UnassignPositionsService;