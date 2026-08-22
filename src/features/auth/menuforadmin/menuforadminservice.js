import { API_URL } from "../../../api/api";
import axiosInstance from "../../../api/axiosinstance";

export const menuforadminservice = (params = {}) => {
    const MENU_FOR_ADMIN_URL = `${API_URL}/api/common/menu-list/`;
    
    return axiosInstance.get(MENU_FOR_ADMIN_URL, { params });
};