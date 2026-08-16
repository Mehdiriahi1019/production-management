import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosInstance";

export const getPaintDetailApi = (id) => {
    const PAINTDITAIL_URL = `${API_URL}/api/production/produc/paint/detail/${id}/`
    return axiosInstance.get(PAINTDITAIL_URL);
};