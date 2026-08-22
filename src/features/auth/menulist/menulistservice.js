// features/menu/menulist/menulistservice.js
import { API_URL } from "../../../api/api";
import axiosInstance from "../../../api/axiosinstance";

export const menulistservice = () => {
    const MENU_LIST_URL = `${API_URL}/api/auth/identify/me/menus/`;
    
    return axiosInstance.get(MENU_LIST_URL);
};