// features/production/goods/addroute/addrouteservice.js
import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosinstance";

export const addrouteservice = (goodsId, payload) => {
    const ADD_ROUTE_URL = `${API_URL}/api/production/produc/goods/${goodsId}/route/`;
    
    return axiosInstance.post(ADD_ROUTE_URL, payload);
};