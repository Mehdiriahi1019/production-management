import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const deviceUpdateService = async (id, payload) => {
    const DEVICE_UPDATE_URL = await `${API_URL}/api/production/produc/update-device/${id}/`
    return axiosInstance.patch(DEVICE_UPDATE_URL, payload)
}