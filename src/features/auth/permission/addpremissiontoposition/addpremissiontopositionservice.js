// features/auth/permission/addpremissiontoposition/addpremissiontopositionservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const addpremissiontopositionservice = (payload) => {
    const ADD_PERMISSION_URL = `${API_URL}/api/production/produc/add-permission/position/`;
    
    return axiosInstance.post(ADD_PERMISSION_URL, payload);
};