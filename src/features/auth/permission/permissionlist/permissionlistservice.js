// features/auth/permissions/permissionlist.service.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const permissionlistservice = (params) => {
    const PERMISSION_LIST_URL = `${API_URL}/api/auth/identify/all/permission/`;
    
    return axiosInstance.get(PERMISSION_LIST_URL, { params });
};