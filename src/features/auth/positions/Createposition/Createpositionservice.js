import axiosInstance from "../../../../api/axiosinstance";
import { API_URL } from "../../../../api/api";

const createPosition = async (payload) => {
  const CREATE_POSITION_URL = `${API_URL}/api/production/produc/create-position/`;
  const response = await axiosInstance.post(CREATE_POSITION_URL, payload);
  return response.data;
};

const CreatePositionService = { createPosition };

export default CreatePositionService;