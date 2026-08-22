// features/production/ordertype/ordertypeservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const ordertypeservice = (params = {}) => {
    const ORDER_TYPE_URL = `${API_URL}/api/production/produc/order-type/`;
    
    return axiosInstance.get(ORDER_TYPE_URL, { params });
};