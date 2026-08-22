// features/production/sheets/sheetsforselect/sheetsforselectservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const sheetsforselectservice = (params = {}) => {
    const SHEETS_FOR_SELECT_URL = `${API_URL}/api/production/produc/sheet/for-select/`;
    
    return axiosInstance.get(SHEETS_FOR_SELECT_URL, { params });
};