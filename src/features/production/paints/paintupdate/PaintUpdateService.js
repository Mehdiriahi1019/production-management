import axiosInstance from "../../../../api/axiosinstance";
import { API_URL } from "../../../../api/api";

const PAINT_UPDATE_URL = (id) =>
  `${API_URL}/api/production/produc/paint/update/${id}/`;

export const updatePaintApi = async ({ id, ...payload }) => {
  const response = await axiosInstance.patch(PAINT_UPDATE_URL(id), payload);
  return response.data;
};