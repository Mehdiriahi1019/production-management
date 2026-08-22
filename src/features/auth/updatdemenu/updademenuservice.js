// features/auth/menuupdate/updademenuservice.js
import { API_URL } from "../../../api/api";
import axiosInstance from "../../../api/axiosinstance";

export const updademenuservice = (menuId, payload) => {
    const UPDATE_MENU_URL = `${API_URL}/api/common/menu-update/${menuId}/`;
    
    return axiosInstance.patch(UPDATE_MENU_URL, payload);
};