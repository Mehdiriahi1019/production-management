import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const serviceslistservice = (params = {}) => {
    const SERVICESLIST_URL = `${API_URL}/api/production/produc/service/list/`;

    return axiosInstance.get(SERVICESLIST_URL, { params });
};