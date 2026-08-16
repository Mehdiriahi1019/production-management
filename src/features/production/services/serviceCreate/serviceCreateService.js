import axiosInstance from "../../../../api/axiosinstance"; 
import { API_URL } from "../../../../api/api";
const SERVICE_CREATE_URL =
 `${API_URL}/api/production/produc/service/create/`;

export const createServiceApi = async (payload) => {
  const response = await axiosInstance.post(SERVICE_CREATE_URL, payload);
  return response.data;
};