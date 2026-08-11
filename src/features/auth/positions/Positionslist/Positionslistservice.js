import axiosInstance from "../../../../api/axiosinstance";
import { API_URL } from "../../../../api/api";

const getPositionsList = async (params = {}) => {
  const LIST_POSITIONS_URL = `${API_URL}/api/production/produc/list-positions/`;
  const response = await axiosInstance.get(LIST_POSITIONS_URL, { params });
  return response.data;
};

const PositionsListService = { getPositionsList };

export default PositionsListService;