// features/production/orders/createorder/createorderservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const createOrderService = (data) => {
    const CREATE_ORDER_URL = `${API_URL}/api/production/produc/order/create/`;
    
    return axiosInstance.post(CREATE_ORDER_URL, data);
};