// features/production/sheets/sheetupdate/sheetsupdateservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const sheetsupdateservice = (id, payload) => {
    const SHEETS_UPDATE_URL = `${API_URL}/api/production/produc/sheet/update/${id}/`;
    
    // فقط فیلدهای مجاز
    const cleanPayload = {
        display_name: payload.display_name,
        code: payload.code,
        is_active: payload.is_active,
        updated_at: payload.updated_at,
    };
    
    return axiosInstance.patch(SHEETS_UPDATE_URL, cleanPayload);
};