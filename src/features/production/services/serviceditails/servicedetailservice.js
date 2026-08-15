import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosInstance";

export const getServiceDetailApi = (id) => {
  return axiosInstance.get(
    `${API_URL}/api/production/produc/service/detail/${id}/`
  );
};