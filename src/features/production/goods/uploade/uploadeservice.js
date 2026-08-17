// features/production/goods/upload/uplodeservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const uplodeservice = (file) => {
    const UPLOAD_URL = `${API_URL}/api/production/produc/goods/import/`;
    
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosInstance.post(UPLOAD_URL, formData, {
       
    });
};