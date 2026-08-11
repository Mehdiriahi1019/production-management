import axiosInstance from "../../../api/axiosinstance";
import { API_URL } from "../../../api/api";

const getPositions = async () => {
  const POSITIONS_URL = `${API_URL}/api/production/produc/select-position/`;
  const response = await axiosInstance.get(POSITIONS_URL);
  return response.data.data;
};

const PositionsService = { getPositions };

export default PositionsService;