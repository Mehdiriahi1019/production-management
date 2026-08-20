// features/auth/permission/deletepermissionforposition/deletepermissionforpositionservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const deletepermissionforpositionservice = (positionId, permissionIds) => {
    const DELETE_PERMISSION_URL = `${API_URL}/api/production/produc/position/${positionId}/permission/`;
    
    return axiosInstance.post(DELETE_PERMISSION_URL, {
        permission_ids: permissionIds
    });
};