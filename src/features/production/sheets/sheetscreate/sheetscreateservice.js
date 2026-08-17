// features/production/sheets/sheetcreate/sheetscreateservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const sheetscreateservice = (payload) => {
    const SHEETS_CREATE_URL = `${API_URL}/api/production/produc/sheet/create/`;
    
    return axiosInstance.post(SHEETS_CREATE_URL, payload);
};