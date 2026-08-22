// features/production/orders/orderlist/orderlistservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const orderlistservice = (params = {}) => {
    const ORDER_LIST_URL = `${API_URL}/api/production/produc/order/list/`;
    
    return axiosInstance.get(ORDER_LIST_URL, { params });
};