// features/auth/positions/Updateposition/Updatepositionservice.js
import axiosInstance from "../../../../api/axiosinstance";
import { API_URL } from "../../../../api/api";

export const updatePositionService = async (id, data) => {
  const response = await axiosInstance.patch(`${API_URL}/api/production/produc/update-position/${id}/`, data);
  return response.data;
};