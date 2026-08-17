// features/production/sheets/sheetdetail/sheetsditailservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const sheetsditailservice = (id) => {
    const SHEETS_DITAIL_URL = `${API_URL}/api/production/produc/sheet/detail/${id}/`;
    
    return axiosInstance.get(SHEETS_DITAIL_URL);
};