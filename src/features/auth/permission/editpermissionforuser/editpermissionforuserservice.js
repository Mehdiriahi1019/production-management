import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const editpermissionforuserservice = (permissionId, payload) => {
    const EDIT_PERMISSION_URL = `${API_URL}/api/auth/identify/update-permission/${permissionId}/permission/`;
    
    return axiosInstance.patch(EDIT_PERMISSION_URL, payload);
};