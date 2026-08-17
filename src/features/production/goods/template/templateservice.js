// features/production/goods/template/templateservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const templateservice = async () => {
    const TEMPLATE_URL = `${API_URL}/api/production/produc/goods/import-template/`;
    
    const response = await axiosInstance.get(TEMPLATE_URL, {
        responseType: 'blob',
    });
    
    return response;
};