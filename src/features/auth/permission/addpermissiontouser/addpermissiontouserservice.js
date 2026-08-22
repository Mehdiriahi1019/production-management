import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const addpermissiontouserservice = (userId, payload) => {
    const ADD_PERMISSION_URL = `${API_URL}/api/auth/identify/add-permiison/${userId}/user/`;
    
    return axiosInstance.post(ADD_PERMISSION_URL, payload);
};