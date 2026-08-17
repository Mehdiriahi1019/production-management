import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const deviceCreateService = async (payload) => {
    const DEVICE_CREATE_URL = `${API_URL}/api/production/produc/create-device/`
    return axiosInstance.post(DEVICE_CREATE_URL, payload)
}