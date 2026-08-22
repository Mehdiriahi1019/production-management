import { API_URL } from "../../../api/api";
import axiosInstance from "../../../api/axiosinstance";

const PAINTSLIST_URL = `${API_URL}/api/production/produc/paint/list/`;

export const paintslistservice = async (params = {}) => {
  const response = await axiosInstance.get(PAINTSLIST_URL, { params });
  return response;
};