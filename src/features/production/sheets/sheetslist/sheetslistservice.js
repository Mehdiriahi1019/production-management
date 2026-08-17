import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const sheetslistservice = (params = {}) => {
    const SHEETSLIST_URL = `${API_URL}/api/production/produc/sheet/list/`;
    
    return axiosInstance.get(SHEETSLIST_URL, { params });
};