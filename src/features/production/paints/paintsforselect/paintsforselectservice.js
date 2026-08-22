// features/production/paints/paintsforselect/paintsforselectservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const paintsforselectservice = (params = {}) => {
    const PAINTS_FOR_SELECT_URL = `${API_URL}/api/production/produc/paint/for-select/`;
    
    return axiosInstance.get(PAINTS_FOR_SELECT_URL, { params });
};