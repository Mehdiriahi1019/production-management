// features/production/productionorder/updatestatus/updatestatusservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const updatestatusservice = (orderId, data) => {
    const UPDATE_STATUS_URL = `${API_URL}/api/production/produc/order/${orderId}/status/`;
    
    return axiosInstance.patch(UPDATE_STATUS_URL, data);
};