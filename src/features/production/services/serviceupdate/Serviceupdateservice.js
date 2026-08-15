import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const updateServiceApi = (id, payload) => {
  return axiosInstance.patch(
    `${API_URL}/api/production/produc/service/update/${id}/`,
    payload
  );
};