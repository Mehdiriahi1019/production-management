// features/auth/permission/deleteuserpermission/deleteuserpermissionservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const deleteuserpermissionservice = (permissionId) => {
    const DELETE_USER_PERMISSION_URL = `${API_URL}/api/auth/identify/update-permission/${permissionId}/permission/`;
    
    return axiosInstance.delete(DELETE_USER_PERMISSION_URL);
};