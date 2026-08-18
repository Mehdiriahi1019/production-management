// features/production/goods/addfile/addfileservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const addfileservice = (id, file) => {
    const ADD_FILE_URL = `${API_URL}/api/production/produc/goods/${id}/files/`;
    
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosInstance.post(ADD_FILE_URL, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};