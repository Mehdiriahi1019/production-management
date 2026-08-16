import axiosInstance from "../../../../api/axiosinstance";
import { API_URL } from "../../../../api/api";

const PAINT_CREATE_URL =
 `${API_URL}/api/production/produc/paint/create/`;

export const createPaintApi = async (payload) => {
  const response = await axiosInstance.post(PAINT_CREATE_URL, payload);
  return response.data;
};