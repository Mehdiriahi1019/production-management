import { API_URL } from "../../../api/api";
import axiosInstance from "../../../api/axiosinstance";

export const getDevicesListApi = (params) => {
  return axiosInstance.get(`${API_URL}/api/production/produc/list-devices/`, {
    params,
  });
};