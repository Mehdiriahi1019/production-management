import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const deviceditailservice = async (id) => {
    const DEVICEDITAIL_URL = `${API_URL}/api/production/produc/detail-devices/${id}/`
    return axiosInstance.get(DEVICEDITAIL_URL)
}