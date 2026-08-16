import axiosInstance from "../../api/axiosinstance";
import { API_URL } from "../../api/api";

const SERVICES_FOR_SELECT_URL =
  `${API_URL}api/production/produc/service/for-select/`;

export const getServicesForSelectApi = async () => {
  const response = await axiosInstance.get(SERVICES_FOR_SELECT_URL);
  return response.data;
};