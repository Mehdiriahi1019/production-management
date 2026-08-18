// features/production/goods/serviceselect/serviceselectservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const serviceselectservice = (params = {}) => {
    const SERVICE_SELECT_URL = `${API_URL}/api/production/produc/service/for-select/`;
    
    return axiosInstance.get(SERVICE_SELECT_URL, { params });
};